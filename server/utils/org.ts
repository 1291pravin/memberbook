import { eq } from "drizzle-orm";
import { db, schema } from "@nuxthub/db";

export function requireOwner(access: { role: string }) {
  if (access.role !== "owner") {
    throw createError({
      statusCode: 403,
      statusMessage: "Owner access required",
    });
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
    .innerJoin(
      schema.organizations,
      eq(schema.orgMemberships.orgId, schema.organizations.id),
    )
    .where(eq(schema.orgMemberships.userId, userId));
  return rows;
}

/** An organization row without stored secrets, safe to send to the dashboard. */
export function publicOrg<T extends { razorpayKeySecretEnc?: string | null; razorpayWebhookSecretEnc?: string | null } | undefined>(org: T) {
  if (!org) return org;
  const { razorpayKeySecretEnc: _k, razorpayWebhookSecretEnc: _w, ...rest } = org;
  return rest;
}
