import type { H3Event } from "h3";
import { eq, and } from "drizzle-orm";
import { db, schema } from "@nuxthub/db";

export async function requireOrgAccess(event: H3Event) {
  const user = await requireAuth(event);
  const orgId = getRouterParam(event, "orgId");
  if (!orgId) {
    throw createError({ statusCode: 400, statusMessage: "Organization ID required" });
  }
  const rows = await db
    .select()
    .from(schema.orgMemberships)
    .where(
      and(
        eq(schema.orgMemberships.userId, user.id),
        eq(schema.orgMemberships.orgId, Number(orgId)),
      ),
    )
    .limit(1);
  if (!rows[0]) {
    throw createError({ statusCode: 403, statusMessage: "No access to this organization" });
  }
  return { userId: user.id, orgId: Number(orgId), role: rows[0].role as "owner" | "staff" };
}

export function requireOwner(access: { role: string }) {
  if (access.role !== "owner") {
    throw createError({ statusCode: 403, statusMessage: "Owner access required" });
  }
}

export async function getUserOrgs(userId: number) {
  const rows = await db
    .select({
      orgId: schema.orgMemberships.orgId,
      role: schema.orgMemberships.role,
      name: schema.organizations.name,
      slug: schema.organizations.slug,
      type: schema.organizations.type,
    })
    .from(schema.orgMemberships)
    .innerJoin(schema.organizations, eq(schema.orgMemberships.orgId, schema.organizations.id))
    .where(eq(schema.orgMemberships.userId, userId));
  return rows;
}
