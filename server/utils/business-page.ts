import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@nuxthub/db";

/**
 * Free business page (/p/<org slug>): plans and prices, contact details and an
 * enquiry form, built from what's already in MemberBook. Free add-on
 * "business_page", so it's only public once the owner switches it on.
 */

export function businessPageUrl(slug: string): string {
  const base = (useRuntimeConfig().public.appUrl as string) || "https://memberbook.in";
  return `${base.replace(/\/$/, "")}/p/${slug}`;
}

export async function getBusinessPageOrg(slug: string) {
  if (!/^[a-z0-9-]{2,80}$/.test(slug)) return null;
  const [org] = await db.select({
    id: schema.organizations.id,
    name: schema.organizations.name,
    slug: schema.organizations.slug,
    type: schema.organizations.type,
    phone: schema.organizations.ownerWhatsapp,
    address: schema.organizations.gstAddress,
    googleReviewUrl: schema.organizations.googleReviewUrl,
  }).from(schema.organizations).where(eq(schema.organizations.slug, slug)).limit(1);
  if (!org || !(await isAddOnActive(org.id, "business_page"))) return null;
  return org;
}

export async function loadBusinessPage(slug: string) {
  const org = await getBusinessPageOrg(slug);
  if (!org) return null;
  const [plans, [site]] = await Promise.all([
    db.select({ name: schema.subscriptionPlans.name, price: schema.subscriptionPlans.price, durationType: schema.subscriptionPlans.durationType, durationValue: schema.subscriptionPlans.durationValue })
      .from(schema.subscriptionPlans)
      .where(and(eq(schema.subscriptionPlans.orgId, org.id), eq(schema.subscriptionPlans.active, true)))
      .orderBy(asc(schema.subscriptionPlans.price))
      .limit(12),
    db.select({ slug: schema.orgWebsites.slug, status: schema.orgWebsites.status })
      .from(schema.orgWebsites).where(eq(schema.orgWebsites.orgId, org.id)).limit(1),
  ]);
  return {
    name: org.name,
    slug: org.slug,
    type: org.type,
    phone: org.phone,
    address: org.address,
    googleReviewUrl: org.googleReviewUrl,
    website: site?.status === "live" ? `/s/${site.slug}` : null,
    plans: plans.filter(p => p.price > 0),
  };
}
