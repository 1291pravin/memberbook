import { and, desc, eq, gte } from "drizzle-orm";
import { db, schema } from "@nuxthub/db";

/** "Reminders from your own WhatsApp": connection state and what the signup popup needs. */
export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const [active, account, org] = await Promise.all([
    isAddOnActive(access.orgId, "own_number"),
    getOwnAccount(access.orgId),
    getOrgCollectionSettings(access.orgId),
  ]);
  // Meta error 131042: the business's Meta billing isn't set up (no card, or business
  // info missing), so every reminder from its number fails. Look at the latest send.
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const [last] = await db.select({ status: schema.reminderLogs.status, error: schema.reminderLogs.error })
    .from(schema.reminderLogs)
    .where(and(eq(schema.reminderLogs.orgId, access.orgId), eq(schema.reminderLogs.via, "own"), gte(schema.reminderLogs.createdAt, since)))
    .orderBy(desc(schema.reminderLogs.id))
    .limit(1);
  const paymentProblem = last?.status === "failed" && String(last.error ?? "").startsWith("131042");
  const signup = embeddedSignupConfig();
  return {
    active,
    signup: { appId: signup.appId, configId: signup.configId, ready: signup.ready },
    account: serializeOwnAccount(account),
    autoRemindersEnabled: Boolean(org?.autoRemindersEnabled),
    hasUpiId: Boolean(org?.upiId),
    paymentProblem,
  };
});
