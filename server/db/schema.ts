import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash"),
  googleId: text("google_id"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const organizations = sqliteTable("organizations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  type: text("type").notNull(), // gym, library, tuition, other
  currency: text("currency").notNull().default("INR"),
  gracePeriodDays: integer("grace_period_days").notNull().default(0),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const orgMemberships = sqliteTable("org_memberships", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  role: text("role").notNull().default("staff"), // owner, staff
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  userOrgUnique: uniqueIndex("org_memberships_user_org_unique").on(table.userId, table.orgId),
}));

export const subscriptionPlans = sqliteTable("subscription_plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  price: integer("price").notNull(), // in paise
  durationType: text("duration_type").notNull(), // daily, weekly, monthly, yearly
  durationValue: integer("duration_value").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const members = sqliteTable("members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  status: text("status").notNull().default("active"), // active, inactive
  notes: text("notes"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const memberSubscriptions = sqliteTable("member_subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  memberId: integer("member_id").notNull().references(() => members.id),
  planId: integer("plan_id").notNull().references(() => subscriptionPlans.id),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  amount: integer("amount").notNull(), // in paise
  status: text("status").notNull().default("active"), // active, expired, cancelled
  autoRenew: integer("auto_renew", { mode: "boolean" }).notNull().default(true),
  paymentStatus: text("payment_status").notNull().default("unpaid"), // unpaid, partial, paid
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  memberId: integer("member_id").notNull().references(() => members.id),
  subscriptionId: integer("subscription_id").references(() => memberSubscriptions.id),
  amount: integer("amount").notNull(), // in paise
  method: text("method").notNull().default("cash"), // cash, upi, card, bank_transfer
  date: text("date").notNull(),
  notes: text("notes"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const inquiries = sqliteTable("inquiries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  interest: text("interest"),
  followUpDate: text("follow_up_date"),
  status: text("status").notNull().default("new"), // new, contacted, converted, lost
  notes: text("notes"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const checkIns = sqliteTable("check_ins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  memberId: integer("member_id").notNull().references(() => members.id),
  checkedInBy: integer("checked_in_by").notNull().references(() => users.id),
  checkedInAt: text("checked_in_at").notNull().$defaultFn(() => new Date().toISOString()),
  checkedOutAt: text("checked_out_at"),
  checkedOutBy: integer("checked_out_by").references(() => users.id),
  durationMinutes: integer("duration_minutes"),
  autoCheckedOut: integer("auto_checked_out", { mode: "boolean" }).notNull().default(false),
  subscriptionStatus: text("subscription_status").notNull(), // active, expired, inactive, none
  notes: text("notes"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const orgInvites = sqliteTable("org_invites", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  invitedByUserId: integer("invited_by_user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  status: text("status").notNull().default("pending"), // pending, accepted, expired, revoked
  expiresAt: text("expires_at").notNull(),
  acceptedByUserId: integer("accepted_by_user_id").references(() => users.id),
  acceptedAt: text("accepted_at"),
  revokedByUserId: integer("revoked_by_user_id").references(() => users.id),
  revokedAt: text("revoked_at"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});
