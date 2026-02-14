import { eq } from "drizzle-orm";
import { db, schema } from "@nuxthub/db";

export default defineEventHandler(async (event) => {
  const access = event.context.access;

  const result = await db.select().from(schema.onboardingProgress)
    .where(eq(schema.onboardingProgress.orgId, access.orgId))
    .limit(1);

  if (!result[0]) {
    throw createError({ statusCode: 404, statusMessage: "Onboarding progress not found" });
  }

  // Get organization details
  const orgResult = await db.select().from(schema.organizations)
    .where(eq(schema.organizations.id, access.orgId))
    .limit(1);

  const org = orgResult[0];
  const progress = result[0];

  // Build applicable steps based on business type
  const steps = [
    { key: 'orgSetup', label: 'Organization Setup', completed: progress.orgSetupCompleted, required: true },
    { key: 'staffOnboarding', label: 'Invite Team Members', completed: progress.staffOnboardingCompleted, required: false },
    { key: 'plansSetup', label: 'Create Subscription Plans', completed: progress.plansSetupCompleted, required: false },
  ];

  // Only include seats for libraries
  if (org.type === 'library') {
    steps.push({
      key: 'businessSetup',
      label: 'Setup Seats',
      completed: progress.businessSetupCompleted,
      required: false,
    });
  }

  steps.push({
    key: 'dashboardTour',
    label: 'Dashboard Tour',
    completed: progress.dashboardTourCompleted,
    required: false,
  });

  const totalSteps = steps.length;
  const completedSteps = steps.filter(s => s.completed).length;
  const percentageComplete = Math.round((completedSteps / totalSteps) * 100);

  return {
    progress: {
      ...progress,
      totalSteps,
      completedSteps,
      percentageComplete,
      applicableSteps: steps,
      isComplete: completedSteps === totalSteps,
    }
  };
});
