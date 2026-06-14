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

  if (!member?.photoKey) {
    throw createError({ statusCode: 404, statusMessage: "No photo" });
  }

  // Private cache: photo is member PII, scoped to the authenticated session
  setHeader(event, "Cache-Control", "private, max-age=3600");
  return blob.serve(event, member.photoKey);
});
