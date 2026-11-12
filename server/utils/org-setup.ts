import type { H3Event } from "h3";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@nuxthub/db";
import { DEFAULT_EXPENSE_CATEGORIES } from "./expense-categories";

export const ORG_TYPES = ["gym", "library", "tuition", "other"] as const;

/**
 * The account that holds businesses we set up for owners who haven't signed in
 * yet. It has no password or Google login (the .invalid domain can't receive
 * mail), so the only way in is admin "login as" from /admin/setup.
 */
export const SETUP_USER_EMAIL = "setup@memberbook.invalid";

/** How long an owner invite link for a business we set up stays valid. */
export const OWNER_INVITE_DAYS = 30;

/** Create a business with its owner, default expense categories and onboarding record. */
export async function createOrganization(input: {
  name: string;
  type: string;
  ownerUserId: number;
  ownerWhatsapp?: string | null;
  setupHelpConsentAt?: string | null;
  setupHelpHandledAt?: string | null;
  upiId?: string | null;
}) {
  const name = input.name.trim();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
    + "-" + Date.now().toString(36);

  const [org] = await db.insert(schema.organizations).values({
    name,
    slug,
    type: input.type,
    ownerWhatsapp: input.ownerWhatsapp ?? null,
    setupHelpConsentAt: input.setupHelpConsentAt ?? null,
    setupHelpHandledAt: input.setupHelpHandledAt ?? null,
    upiId: input.upiId ?? null,
  }).returning();
  if (!org) throw createError({ statusCode: 500, statusMessage: "Could not create the business" });

  const categories = DEFAULT_EXPENSE_CATEGORIES[input.type] ?? DEFAULT_EXPENSE_CATEGORIES.other ?? [];

  await db.batch([
    db.insert(schema.orgMemberships).values({ userId: input.ownerUserId, orgId: org.id, role: "owner" }),
    db.insert(schema.expenseCategories).values(categories.map(cat => ({
      orgId: org.id,
      name: cat.name,
      description: cat.description,
      color: cat.color,
      isSystem: true,
      isActive: true,
      displayOrder: cat.displayOrder,
    }))),
    db.insert(schema.onboardingProgress).values({
      orgId: org.id,
      orgSetupCompleted: true,
      staffOnboardingCompleted: false,
      plansSetupCompleted: false,
      businessSetupCompleted: input.type !== "library", // only libraries have a business setup step
      dashboardTourCompleted: true, // the tour is not implemented yet
    }),
  ]);

  return org;
}

/** Find or create the setup account (see SETUP_USER_EMAIL). */
export async function getSetupUser() {
  const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, SETUP_USER_EMAIL)).limit(1);
  if (existing) return existing;
  await db.insert(schema.users)
    .values({ email: SETUP_USER_EMAIL, name: "MemberBook Setup" })
    .onConflictDoNothing();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, SETUP_USER_EMAIL)).limit(1);
  return user!;
}

export function generateInviteToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Revoke any pending owner invites for the org and create a fresh one. */
export async function createOwnerInvite(orgId: number, invitedByUserId: number) {
  const now = new Date().toISOString();
  await db.update(schema.orgInvites)
    .set({ status: "revoked", revokedAt: now, updatedAt: now })
    .where(and(
      eq(schema.orgInvites.orgId, orgId),
      eq(schema.orgInvites.role, "owner"),
      eq(schema.orgInvites.status, "pending"),
    ));

  const [invite] = await db.insert(schema.orgInvites).values({
    orgId,
    invitedByUserId,
    token: generateInviteToken(),
    role: "owner",
    status: "pending",
    expiresAt: new Date(Date.now() + OWNER_INVITE_DAYS * 86400000).toISOString(),
  }).returning();
  return invite!;
}

/** Public base URL for links we hand out, such as invite links. */
export function appBaseUrl(event: H3Event) {
  const configured = String(useRuntimeConfig(event).public.appUrl || "");
  if (configured) return configured.replace(/\/$/, "");
  const headers = getRequestHeaders(event);
  return `${headers["x-forwarded-proto"] || "https"}://${headers.host}`;
}
