import { and, count, eq, notInArray } from "drizzle-orm";
import type { DemoIds } from "~~/server/utils/demo-data";

// Whether sample data is loaded, and how many of the org's members and plans
// are real (not sample). The dashboard uses the real counts to keep showing the
// "add your members" checklist while sample data fills the rest of the page.
export default defineEventHandler(async (event) => {
  const access = event.context.access;

  const [org] = await db
    .select({ demoDataIds: schema.organizations.demoDataIds })
    .from(schema.organizations)
    .where(eq(schema.organizations.id, access.orgId))
    .limit(1);

  let ids: Partial<DemoIds> = {};
  if (org?.demoDataIds) {
    try {
      ids = JSON.parse(org.demoDataIds);
    }
    catch {
      ids = {};
    }
  }
  const demoMemberIds = ids.memberIds ?? [];
  const demoPlanIds = ids.planIds ?? [];

  const [[members], [plans]] = await Promise.all([
    db.select({ count: count() }).from(schema.members).where(and(
      eq(schema.members.orgId, access.orgId),
      demoMemberIds.length ? notInArray(schema.members.id, demoMemberIds) : undefined,
    )),
    db.select({ count: count() }).from(schema.subscriptionPlans).where(and(
      eq(schema.subscriptionPlans.orgId, access.orgId),
      demoPlanIds.length ? notInArray(schema.subscriptionPlans.id, demoPlanIds) : undefined,
    )),
  ]);

  return {
    hasDemoData: !!org?.demoDataIds,
    realMembers: members?.count ?? 0,
    realPlans: plans?.count ?? 0,
  };
});
