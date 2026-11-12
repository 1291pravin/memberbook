import { sqliteTable, text, integer, uniqueIndex, index, primaryKey } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash"),
  googleId: text("google_id"),
  sessionVersion: integer("session_version").notNull().default(0),
  lastSeenAt: text("last_seen_at"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  googleIdIdx: index("users_google_id_idx").on(table.googleId),
}));

export const organizations = sqliteTable("organizations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  type: text("type").notNull(), // gym, library, tuition, other
  currency: text("currency").notNull().default("INR"),
  ownerWhatsapp: text("owner_whatsapp"),
  setupHelpConsentAt: text("setup_help_consent_at"),
  setupHelpHandledAt: text("setup_help_handled_at"),
  gracePeriodDays: integer("grace_period_days").notNull().default(0),
  demoDataIds: text("demo_data_ids"), // JSON blob of seeded record IDs, null = no demo data
  upiId: text("upi_id"), // owner's UPI ID; reminders include a pay link to it
  upiPayeeName: text("upi_payee_name"), // name shown in the UPI app, defaults to the org name
  autoRemindersEnabled: integer("auto_reminders_enabled", { mode: "boolean" }).notNull().default(false),
  reminderDaysBefore: integer("reminder_days_before").notNull().default(3),
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
  orgIdx: index("org_memberships_org_idx").on(table.orgId),
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
}, (table) => ({
  orgIdx: index("subscription_plans_org_idx").on(table.orgId),
}));

export const members = sqliteTable("members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  gender: text("gender"), // "male", "female", null
  status: text("status").notNull().default("active"), // active, inactive
  notes: text("notes"),
  fatherName: text("father_name"),
  address: text("address"),
  batch: text("batch"),
  photoKey: text("photo_key"), // R2/blob pathname of the member's photo, null = no photo
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  orgCreatedIdx: index("members_org_created_idx").on(table.orgId, table.createdAt),
}));

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
}, (table) => ({
  orgMemberIdx: index("member_subscriptions_org_member_idx").on(table.orgId, table.memberId),
  orgEndDateIdx: index("member_subscriptions_org_end_date_idx").on(table.orgId, table.endDate),
}));

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
}, (table) => ({
  orgDateIdx: index("payments_org_date_idx").on(table.orgId, table.date),
  subscriptionIdx: index("payments_subscription_idx").on(table.subscriptionId),
  memberIdx: index("payments_member_idx").on(table.memberId),
}));

// Fee collection (Collections page): public pay links and the reminders sent.
export const paymentLinks = sqliteTable("payment_links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  memberId: integer("member_id").notNull().references(() => members.id),
  subscriptionId: integer("subscription_id").notNull().references(() => memberSubscriptions.id),
  kind: text("kind").notNull(), // due (unpaid balance), renewal (next period)
  amount: integer("amount").notNull(), // in paise
  token: text("token").notNull(),
  status: text("status").notNull().default("open"), // open, paid
  claimedAt: text("claimed_at"), // member tapped "I have paid"
  paidAt: text("paid_at"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  tokenUnique: uniqueIndex("payment_links_token_unique").on(table.token),
  subscriptionKindUnique: uniqueIndex("payment_links_subscription_kind_unique").on(table.subscriptionId, table.kind),
  orgIdx: index("payment_links_org_idx").on(table.orgId),
}));

export const reminderLogs = sqliteTable("reminder_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  memberId: integer("member_id").notNull().references(() => members.id),
  subscriptionId: integer("subscription_id").notNull().references(() => memberSubscriptions.id),
  kind: text("kind").notNull(), // due, renewal
  channel: text("channel").notNull(), // whatsapp_link (tap-to-send), whatsapp_api (Cloud API)
  status: text("status").notNull(), // opened, sent, delivered, read, failed
  amount: integer("amount").notNull(), // in paise
  providerMessageId: text("provider_message_id"),
  error: text("error"),
  sentBy: integer("sent_by").references(() => users.id), // null = automatic
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  orgSubscriptionIdx: index("reminder_logs_org_subscription_idx").on(table.orgId, table.subscriptionId),
  providerMessageIdx: index("reminder_logs_provider_message_idx").on(table.providerMessageId),
}));

// WhatsApp Cloud API inbox: messages to and from MemberBook's business number
// (support chats from owners, replies from members to reminders).
export const whatsappMessages = sqliteTable("whatsapp_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  waMessageId: text("wa_message_id"), // Meta's message id (wamid...)
  direction: text("direction").notNull(), // in, out
  phone: text("phone").notNull(), // the other party, digits with country code
  contactName: text("contact_name"),
  type: text("type").notNull(), // text, image, button, ...
  body: text("body").notNull(),
  status: text("status").notNull(), // received, sent, delivered, read, failed
  error: text("error"),
  readAt: text("read_at"), // when an admin opened an inbound message
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  waMessageIdUnique: uniqueIndex("whatsapp_messages_wa_id_unique").on(table.waMessageId),
  phoneIdx: index("whatsapp_messages_phone_idx").on(table.phone, table.createdAt),
}));

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
}, (table) => ({
  orgIdx: index("inquiries_org_idx").on(table.orgId),
}));

export const librarySeats = sqliteTable("library_seats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  seatNumber: text("seat_number").notNull(),
  seatLabel: text("seat_label"),
  timePreference: text("time_preference"), // "day", "evening", "flexible", "all-day"
  genderPreference: text("gender_preference"), // "male", "female", "any"
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  displayOrder: integer("display_order").notNull(),
  notes: text("notes"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  orgIdx: index("library_seats_org_idx").on(table.orgId),
}));

export const seatBatches = sqliteTable("seat_batches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  startTime: text("start_time"), // "09:00" optional, for display
  endTime: text("end_time"), // "12:00" optional
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  orgNameUnique: uniqueIndex("seat_batches_org_name_unique").on(table.orgId, table.name),
}));

export const memberSeatAssignments = sqliteTable("member_seat_assignments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  memberId: integer("member_id").notNull().references(() => members.id),
  seatId: integer("seat_id").notNull().references(() => librarySeats.id),
  batchId: integer("batch_id").references(() => seatBatches.id),
  assignedAt: text("assigned_at").notNull().$defaultFn(() => new Date().toISOString()),
  assignedBy: integer("assigned_by").notNull().references(() => users.id),
  notes: text("notes"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  memberOrgBatchUnique: uniqueIndex("member_seat_assignments_member_org_batch_unique")
    .on(table.memberId, table.orgId, table.batchId),
}));

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
  seatId: integer("seat_id").references(() => librarySeats.id),
  seatNumber: text("seat_number"), // Denormalized for history
  batchId: integer("batch_id").references(() => seatBatches.id),
  batchName: text("batch_name"), // Denormalized for history
  notes: text("notes"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  orgCheckedInIdx: index("check_ins_org_checked_in_idx").on(table.orgId, table.checkedInAt),
  memberIdx: index("check_ins_member_idx").on(table.memberId),
}));

export const orgInvites = sqliteTable("org_invites", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  invitedByUserId: integer("invited_by_user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  role: text("role").notNull().default("staff"), // staff, or owner for a business we set up for its owner
  status: text("status").notNull().default("pending"), // pending, accepted, expired, revoked
  expiresAt: text("expires_at").notNull(),
  acceptedByUserId: integer("accepted_by_user_id").references(() => users.id),
  acceptedAt: text("accepted_at"),
  revokedByUserId: integer("revoked_by_user_id").references(() => users.id),
  revokedAt: text("revoked_at"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// Data an owner sends us once (files and/or pasted text) for the AI loading routine.
export const dataUploads = sqliteTable("data_uploads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  uploadedBy: integer("uploaded_by").references(() => users.id), // null = added by admin
  source: text("source").notNull().default("owner"), // owner, admin
  files: text("files").notNull().default("[]"), // JSON: [{ key, name, type, size }]
  text: text("text"), // pasted list
  note: text("note"), // anything the owner wants us to know
  status: text("status").notNull().default("pending"), // pending, processing, done, failed
  result: text("result"), // JSON: { plansCreated, membersLoaded, skipped: [{ name, reason }] }
  message: text("message"), // shown to the owner, e.g. why it failed
  claimedAt: text("claimed_at"),
  processedAt: text("processed_at"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, table => ({
  statusIdx: index("data_uploads_status_idx").on(table.status, table.createdAt),
  orgIdx: index("data_uploads_org_idx").on(table.orgId, table.createdAt),
}));

export const expenseCategories = sqliteTable("expense_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").notNull().default("slate"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  isSystem: integer("is_system", { mode: "boolean" }).notNull().default(false),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  orgNameUnique: uniqueIndex("expense_categories_org_name_unique").on(table.orgId, table.name),
}));

export const expenses = sqliteTable("expenses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  categoryId: integer("category_id").notNull().references(() => expenseCategories.id),
  amount: integer("amount").notNull(), // in paise
  date: text("date").notNull(), // YYYY-MM-DD
  paymentMethod: text("payment_method").notNull().default("cash"), // cash, upi, card, bank_transfer
  vendorName: text("vendor_name"),
  description: text("description").notNull(),
  notes: text("notes"),
  isRecurring: integer("is_recurring", { mode: "boolean" }).notNull().default(false),
  recurringFrequency: text("recurring_frequency"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  orgDateIdx: index("expenses_org_date_idx").on(table.orgId, table.date),
}));

export const onboardingProgress = sqliteTable("onboarding_progress", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  orgSetupCompleted: integer("org_setup_completed", { mode: "boolean" }).notNull().default(true),
  staffOnboardingCompleted: integer("staff_onboarding_completed", { mode: "boolean" }).notNull().default(false),
  plansSetupCompleted: integer("plans_setup_completed", { mode: "boolean" }).notNull().default(false),
  businessSetupCompleted: integer("business_setup_completed", { mode: "boolean" }).notNull().default(false),
  dashboardTourCompleted: integer("dashboard_tour_completed", { mode: "boolean" }).notNull().default(false),
  completedAt: text("completed_at"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  orgIdUnique: uniqueIndex("onboarding_progress_org_unique").on(table.orgId),
}));

export const contactSubmissions = sqliteTable("contact_submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  businessName: text("business_name").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"), // new, contacted, resolved
  sourcePage: text("source_page"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const adminAuditLogs = sqliteTable("admin_audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  action: text("action").notNull(),
  targetUserId: integer("target_user_id").references(() => users.id),
  targetOrgId: integer("target_org_id").references(() => organizations.id),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  metadata: text("metadata"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const authRateLimits = sqliteTable("auth_rate_limits", {
  key: text("key").primaryKey(),
  windowStart: integer("window_start").notNull(),
  count: integer("count").notNull().default(0),
});

// One row per user, org and IST day the user opened the app (return-visit tracking).
export const userActivityDays = sqliteTable("user_activity_days", {
  userId: integer("user_id").notNull().references(() => users.id),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  day: text("day").notNull(), // YYYY-MM-DD in IST
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.orgId, table.day] }),
  orgDayIdx: index("user_activity_days_org_idx").on(table.orgId, table.day),
}));
