import { and, eq } from "drizzle-orm";
import { blob } from "@nuxthub/blob";

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
    try {
      await blob.del(member.photoKey);
    } catch {
      // Object already gone — ignore
    }
    await db
      .update(schema.members)
      .set({ photoKey: null })
      .where(and(eq(schema.members.id, memberId), eq(schema.members.orgId, access.orgId)));
  }

  return { success: true };
});
