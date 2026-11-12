/**
 * Daily at 09:00 IST: create this month's bill for businesses whose free month
 * on a paid add-on is over. Owners see it on /dashboard/add-ons.
 */
export default defineTask({
  meta: {
    name: "addons:billing",
    description: "Create monthly bills for paid add-ons after the free month",
  },
  async run() {
    const result = await generateAddOnBills();
    console.log(`[addons:billing] created=${result.created} businesses=${result.businesses}`);
    return { result: `created ${result.created} bills` };
  },
});
