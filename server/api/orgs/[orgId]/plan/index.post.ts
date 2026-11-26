/** Body { plan: free | autopilot | pro, cycle?: monthly | yearly }: switch plan. Owner only. */
export default defineEventHandler(async (event) => {
  const access = event.context.access;
  requireOwner(access);
  const body = await readBody<{ plan?: string; cycle?: string }>(event);
  const plan = String(body?.plan || "") as PlanKey;
  if (!PLANS.some(p => p.key === plan)) throw createError({ statusCode: 400, statusMessage: "Pick Free, Autopilot or Pro" });
  const cycle: BillingCycle = body?.cycle === "yearly" ? "yearly" : "monthly";
  await choosePlan(access.orgId, plan, cycle);
  return getOrgPlan(access.orgId);
});
