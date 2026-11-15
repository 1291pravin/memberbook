/** The owner's referral link and what it has earned so far. */
export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const summary = await referralSummary(access.orgId);
  const base = useRuntimeConfig(event).public.appUrl || "https://memberbook.in";
  return {
    link: `${String(base).replace(/\/$/, "")}/?utm_source=referral&utm_medium=owner&utm_campaign=${referralCampaign(access.orgId)}`,
    rewardDays: REFERRAL_REWARD_DAYS,
    ...summary,
  };
});
