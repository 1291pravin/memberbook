import { eq } from "drizzle-orm";

/**
 * Load what was read from an upload (plans, members with due dates, rows that
 * couldn't be read) into the business, and mark the upload done. Body: LoadInput,
 * plus optional `upiId` and `final: false` to load in several calls.
 */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const upload = await getUploadOr404(event);
  if (upload.status !== "processing") {
    throw createError({ statusCode: 409, statusMessage: "Claim the upload first" });
  }

  const body = await readBody<LoadInput & { upiId?: string; final?: boolean }>(event);
  const invalid = validateLoadInput(body);
  if (invalid) throw createError({ statusCode: 400, statusMessage: invalid });

  if (body.upiId && !UPI_ID_PATTERN.test(body.upiId.trim())) {
    throw createError({ statusCode: 400, statusMessage: "Invalid UPI ID" });
  }

  const result = await loadOrgData(upload.orgId, body);

  if (body.upiId) {
    const [org] = await db.select({ upiId: schema.organizations.upiId }).from(schema.organizations)
      .where(eq(schema.organizations.id, upload.orgId)).limit(1);
    if (!org?.upiId) {
      await db.update(schema.organizations).set({ upiId: body.upiId.trim() }).where(eq(schema.organizations.id, upload.orgId));
    }
  }

  // Several calls for one upload add up into a single report.
  const previous = parseUploadResult(upload.result);
  const merged = previous
    ? {
        plansCreated: previous.plansCreated + result.plansCreated,
        membersLoaded: previous.membersLoaded + result.membersLoaded,
        membersWithoutDueDate: previous.membersWithoutDueDate + result.membersWithoutDueDate,
        dueNow: previous.dueNow + result.dueNow,
        skipped: [...previous.skipped, ...result.skipped].slice(0, 500),
        warnings: [...(previous.warnings ?? []), ...result.warnings].slice(0, 500),
      }
    : result;

  const final = body.final !== false;
  await db.update(schema.dataUploads).set({
    result: JSON.stringify(merged),
    ...(final ? { status: "done", processedAt: new Date().toISOString(), message: null } : {}),
  }).where(eq(schema.dataUploads.id, upload.id));

  if (final && merged.plansCreated + merged.membersLoaded > 0) {
    await autoCompleteOnboardingStep(upload.orgId, "plansSetupCompleted");
  }

  return { ...merged, status: final ? "done" : "processing" };
});
