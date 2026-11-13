/**
 * Daily at 09:00 IST: create this month's bill for businesses whose free month
 * on a paid add-on is over, plus renewal bills for prepaid add-ons (WhatsApp
 * reminders) that run out within a few days. Owners see them on /dashboard/add-ons.
 */
export default defineTask({
  meta: {
    name: "addons:billing",
    description: "Create monthly bills for paid add-ons after the free month",
  },
  async run() {
    const result = await generateAddOnBills();
    const renewals = await generatePrepaidRenewals();
    console.log(`[addons:billing] created=${result.created} businesses=${result.businesses} prepaidRenewals=${renewals}`);
    return { result: `created ${result.created} bills, ${renewals} prepaid renewals` };
  },
});
