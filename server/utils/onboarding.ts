import { eq } from "drizzle-orm";
import { db, schema } from "@nuxthub/db";

export async function autoCompleteOnboardingStep(
  orgId: number,
  step: 'staffOnboardingCompleted' | 'plansSetupCompleted' | 'businessSetupCompleted'
) {
  try {
    const result = await db.select().from(schema.onboardingProgress)
      .where(eq(schema.onboardingProgress.orgId, orgId))
      .limit(1);

    if (result[0] && !result[0][step]) {
      await db.update(schema.onboardingProgress)
        .set({
          [step]: true,
          updatedAt: new Date().toISOString()
        })
        .where(eq(schema.onboardingProgress.orgId, orgId));
    }
  } catch (error) {
    console.error('Failed to auto-complete onboarding step:', error);
  }
}
