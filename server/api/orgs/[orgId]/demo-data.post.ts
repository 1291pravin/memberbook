import { eq, count } from "drizzle-orm";
import {
  generateDemoPlans,
  generateDemoMembers,
  generateDemoSubscriptions,
  generateDemoPayments,
  generateDemoInquiries,
  generateDemoSeats,
  generateDemoSeatAssignments,
} from "~~/server/utils/demo-data";
import type { DemoIds } from "~~/server/utils/demo-data";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  requireOwner(access);

  // Guard: reject if demo data already loaded
  const [org] = await db
    .select({ demoDataIds: schema.organizations.demoDataIds })
    .from(schema.organizations)
    .where(eq(schema.organizations.id, access.orgId))
    .limit(1);

  if (org?.demoDataIds) {
    throw createError({
      statusCode: 400,
      statusMessage: "Sample data is already loaded. Clear it first before loading again.",
    });
  }

  // Guard: reject if org already has members
  const [memberCount] = await db
    .select({ count: count() })
    .from(schema.members)
    .where(eq(schema.members.orgId, access.orgId));

  if (memberCount.count > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Cannot load sample data when you already have members. Sample data is designed for new organizations.",
    });
  }

  const orgType = (await db
    .select({ type: schema.organizations.type })
    .from(schema.organizations)
    .where(eq(schema.organizations.id, access.orgId))
    .limit(1))[0]?.type || "other";

  const demoIds: DemoIds = {
    planIds: [],
    memberIds: [],
    subscriptionIds: [],
    paymentIds: [],
    inquiryIds: [],
    seatBatchIds: [],
    seatIds: [],
    seatAssignmentIds: [],
  };

  const CHUNK_SIZE = 5;

  // 1. Insert plans
  const planValues = generateDemoPlans(orgType, access.orgId);
  for (const p of planValues) {
    const [result] = await db.insert(schema.subscriptionPlans).values(p).returning({ id: schema.subscriptionPlans.id });
    demoIds.planIds.push(result.id);
  }

  // 2. Insert members (chunk for D1 param limit)
  const memberValues = generateDemoMembers(access.orgId);
  for (let i = 0; i < memberValues.length; i += CHUNK_SIZE) {
    const chunk = memberValues.slice(i, i + CHUNK_SIZE);
    const results = await db.insert(schema.members).values(chunk).returning({ id: schema.members.id });
    demoIds.memberIds.push(...results.map((r: { id: number }) => r.id));
  }

  // 3. Insert subscriptions
  const subValues = generateDemoSubscriptions(access.orgId, demoIds.planIds, demoIds.memberIds, orgType);
  for (let i = 0; i < subValues.length; i += CHUNK_SIZE) {
    const chunk = subValues.slice(i, i + CHUNK_SIZE);
    const results = await db.insert(schema.memberSubscriptions).values(chunk).returning({ id: schema.memberSubscriptions.id });
    demoIds.subscriptionIds.push(...results.map((r: { id: number }) => r.id));
  }

  // 4. Insert payments
  const paymentInputs = subValues.map((s) => ({
    amount: s.amount,
    startDate: s.startDate,
    paymentStatus: s.paymentStatus as string,
    memberId: s.memberId,
  }));
  const paymentValues = generateDemoPayments(access.orgId, demoIds.memberIds, demoIds.subscriptionIds, paymentInputs);
  for (let i = 0; i < paymentValues.length; i += CHUNK_SIZE) {
    const chunk = paymentValues.slice(i, i + CHUNK_SIZE);
    const results = await db.insert(schema.payments).values(chunk).returning({ id: schema.payments.id });
    demoIds.paymentIds.push(...results.map((r: { id: number }) => r.id));
  }

  // 5. Insert inquiries
  const inquiryValues = generateDemoInquiries(access.orgId);
  const inquiryResults = await db
    .insert(schema.inquiries)
    .values(inquiryValues)
    .returning({ id: schema.inquiries.id });
  demoIds.inquiryIds = inquiryResults.map((r: { id: number }) => r.id);

  // 6. Library-specific: seats and assignments
  if (orgType === "library") {
    const { batches, seats } = generateDemoSeats(access.orgId);

    for (const b of batches) {
      const [result] = await db.insert(schema.seatBatches).values(b).returning({ id: schema.seatBatches.id });
      demoIds.seatBatchIds.push(result.id);
    }

    for (let i = 0; i < seats.length; i += CHUNK_SIZE) {
      const chunk = seats.slice(i, i + CHUNK_SIZE);
      const results = await db.insert(schema.librarySeats).values(chunk).returning({ id: schema.librarySeats.id });
      demoIds.seatIds.push(...results.map((r: { id: number }) => r.id));
    }

    // Seat assignments
    const assignmentValues = generateDemoSeatAssignments(
      access.orgId,
      demoIds.memberIds,
      demoIds.seatIds,
      demoIds.seatBatchIds,
      access.userId,
    );
    for (let i = 0; i < assignmentValues.length; i += CHUNK_SIZE) {
      const chunk = assignmentValues.slice(i, i + CHUNK_SIZE);
      const results = await db.insert(schema.memberSeatAssignments).values(chunk).returning({ id: schema.memberSeatAssignments.id });
      demoIds.seatAssignmentIds.push(...results.map((r: { id: number }) => r.id));
    }

    await autoCompleteOnboardingStep(access.orgId, "businessSetupCompleted");
  }

  // Save demo IDs to org
  await db
    .update(schema.organizations)
    .set({ demoDataIds: JSON.stringify(demoIds) })
    .where(eq(schema.organizations.id, access.orgId));

  // Auto-complete onboarding steps
  await autoCompleteOnboardingStep(access.orgId, "plansSetupCompleted");


  return { success: true, demoIds };
});
