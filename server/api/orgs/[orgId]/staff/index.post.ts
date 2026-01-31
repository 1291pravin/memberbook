import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  requireOwner(access);

  const body = await readBody(event);
  const { email } = body;

  if (!email) {
    throw createError({ statusCode: 400, statusMessage: "Email is required" });
  }

  const user = await findUserByEmail(email.toLowerCase().trim());
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: "No user found with that email. They must register first." });
  }

  // Check if already a member
  const existing = await db
    .select()
    .from(schema.orgMemberships)
    .where(
      and(
        eq(schema.orgMemberships.userId, user.id),
        eq(schema.orgMemberships.orgId, access.orgId),
      ),
    )
    .limit(1);

  if (existing[0]) {
    throw createError({ statusCode: 409, statusMessage: "User is already a member of this organization" });
  }

  await db.insert(schema.orgMemberships).values({
    userId: user.id,
    orgId: access.orgId,
    role: "staff",
  });

  await invalidateCache(access.orgId, "staff");
  return { success: true };
});
