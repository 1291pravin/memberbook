import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;

  const [org] = await db
    .select({ demoDataIds: schema.organizations.demoDataIds })
    .from(schema.organizations)
    .where(eq(schema.organizations.id, access.orgId))
    .limit(1);

  return { hasDemoData: !!org?.demoDataIds };
});
