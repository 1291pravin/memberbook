import { eq } from "drizzle-orm";
import { db, schema } from "@nuxthub/db";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const body = await readBody(event);

  const updates: Record<string, boolean | string> = {};
  const validFields = ['staffOnboardingCompleted', 'plansSetupCompleted', 'businessSetupCompleted', 'dashboardTourCompleted'];

  for (const field of validFields) {
    if (field in body && typeof body[field] === 'boolean') {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, statusMessage: "No valid fields to update" });
  }

  updates.updatedAt = new Date().toISOString();

  await db.update(schema.onboardingProgress)
    .set(updates)
    .where(eq(schema.onboardingProgress.orgId, access.orgId));

  return { success: true };
});
