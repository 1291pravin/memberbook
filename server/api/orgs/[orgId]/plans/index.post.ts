export default defineEventHandler(async (event) => {
  const access = event.context.access;
  requireOwner(access);
  const body = await readBody(event);
  const { name, price, durationType, durationValue } = body;

  if (!name || !price || !durationType || !durationValue) {
    throw createError({ statusCode: 400, statusMessage: "Name, price, duration type, and duration value are required" });
  }

  const priceValue = Number(price);
  if (!Number.isInteger(priceValue) || priceValue <= 0) {
    throw createError({ statusCode: 400, statusMessage: "Price must be a positive amount" });
  }

  const validTypes = ["daily", "weekly", "monthly", "yearly"];
  if (!validTypes.includes(durationType)) {
    throw createError({ statusCode: 400, statusMessage: "Duration type must be daily, weekly, monthly, or yearly" });
  }

  if (!Number.isInteger(Number(durationValue)) || Number(durationValue) < 1) {
    throw createError({ statusCode: 400, statusMessage: "Duration value must be a positive integer" });
  }

  const result = await db.insert(schema.subscriptionPlans).values({
    orgId: access.orgId,
    name: name.trim(),
    price: priceValue,
    durationType,
    durationValue: Number(durationValue),
  }).returning();


  // Auto-complete onboarding step
  await autoCompleteOnboardingStep(access.orgId, 'plansSetupCompleted');

  return { plan: result[0] };
});
