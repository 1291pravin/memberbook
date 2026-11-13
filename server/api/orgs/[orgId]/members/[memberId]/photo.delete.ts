import { and, eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const memberId = Number(getRouterParam(event, "memberId"));
  if (!Number.isInteger(memberId) || memberId <= 0) {
    throw createError({ statusCode: 400, statusMessage: "Invalid member ID" });
  }

  const [member] = await db
    .select({ photoKey: schema.members.photoKey })
    .from(schema.members)
    .where(and(eq(schema.members.id, memberId), eq(schema.members.orgId, access.orgId)))
    .limit(1);

  if (!member) {
    throw createError({ statusCode: 404, statusMessage: "Member not found" });
  }

  if (member.photoKey) {
    await deleteMemberPhoto(member.photoKey);
    await db
      .update(schema.members)
      .set({ photoKey: null })
      .where(and(eq(schema.members.id, memberId), eq(schema.members.orgId, access.orgId)));
  }

  return { success: true };
});
