import { eq } from "drizzle-orm";

interface ImportRow {
  name: string;
  phone?: string;
  email?: string;
  status?: string;
  notes?: string;
  plan?: string;
  startDate?: string;
  amountPaid?: number;
  paymentMethod?: string;
}

const BATCH_SIZE = 50;

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const body = await readBody(event);
  const rows: ImportRow[] = body.members;

  if (!Array.isArray(rows) || rows.length === 0) {
    throw createError({ statusCode: 400, statusMessage: "No members provided" });
  }
  if (rows.length > 200) {
    throw createError({ statusCode: 400, statusMessage: "Maximum 200 members per import" });
  }

  // Build plan name → plan map
  const plans = await db
    .select()
    .from(schema.subscriptionPlans)
    .where(eq(schema.subscriptionPlans.orgId, access.orgId));

  const planMap = new Map<string, typeof plans[0]>();
  for (const p of plans) {
    planMap.set(p.name.toLowerCase().trim(), p);
  }

  const results: { success: boolean; error?: string; memberId?: number }[] = [];

  // Process in batches to stay within Worker CPU limits
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    // Separate simple members (no subscription) from complex ones
    const simpleRows: { row: ImportRow; index: number }[] = [];
    const complexRows: { row: ImportRow; index: number }[] = [];

    for (let j = 0; j < batch.length; j++) {
      const row = batch[j]!;
      if (!row.name?.trim()) {
        results[i + j] = { success: false, error: "Name is required" };
        continue;
      }
      if (row.plan?.trim() && row.startDate?.trim()) {
        complexRows.push({ row, index: i + j });
      }
      else {
        simpleRows.push({ row, index: i + j });
      }
    }

    // Bulk insert simple members (no subscription needed)
    if (simpleRows.length > 0) {
      try {
        const inserted = await db.insert(schema.members).values(
          simpleRows.map(({ row }) => ({
            orgId: access.orgId,
            name: row.name.trim(),
            phone: row.phone?.trim() || null,
            email: row.email?.trim() || null,
            status: row.status === "inactive" ? "inactive" as const : "active" as const,
            notes: row.notes?.trim() || null,
          })),
        ).returning();

        for (let k = 0; k < simpleRows.length; k++) {
          results[simpleRows[k]!.index] = { success: true, memberId: inserted[k]!.id };
        }
      }
      catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Bulk insert failed";
        for (const { index } of simpleRows) {
          results[index] = { success: false, error: message };
        }
      }
    }

    // Process complex rows (with subscription + payment) individually
    for (const { row, index } of complexRows) {
      try {
        const [member] = await db.insert(schema.members).values({
          orgId: access.orgId,
          name: row.name.trim(),
          phone: row.phone?.trim() || null,
          email: row.email?.trim() || null,
          status: row.status === "inactive" ? "inactive" : "active",
          notes: row.notes?.trim() || null,
        }).returning();

        const plan = planMap.get(row.plan!.toLowerCase().trim());
        if (!plan) {
          results[index] = { success: true, memberId: member.id, error: `Plan "${row.plan}" not found — member created without subscription` };
          continue;
        }

        const endDate = calculateEndDate(row.startDate!, plan.durationType, plan.durationValue);
        const amountPaid = row.amountPaid ? Math.round(Number(row.amountPaid) * 100) : 0;
        let paymentStatus = "unpaid";
        if (amountPaid > 0) {
          paymentStatus = amountPaid >= plan.price ? "paid" : "partial";
        }

        const [subscription] = await db.insert(schema.memberSubscriptions).values({
          orgId: access.orgId,
          memberId: member.id,
          planId: plan.id,
          startDate: row.startDate!,
          endDate,
          amount: plan.price,
          autoRenew: true,
          paymentStatus,
        }).returning();

        if (amountPaid > 0) {
          await db.insert(schema.payments).values({
            orgId: access.orgId,
            memberId: member.id,
            subscriptionId: subscription.id,
            amount: amountPaid,
            method: row.paymentMethod || "cash",
            date: row.startDate!,
            notes: "Imported via CSV",
          });
        }

        results[index] = { success: true, memberId: member.id };
      }
      catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        results[index] = { success: false, error: message };
      }
    }
  }

  // Invalidate caches
  await invalidateCache(access.orgId);

  // Filter out any undefined slots from skipped rows
  const finalResults = rows.map((_, i) => results[i] ?? { success: false, error: "Not processed" });
  return { results: finalResults };
});
