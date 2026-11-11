import type { H3Event } from "h3";
import { eq } from "drizzle-orm";
import type { UserSession } from "#auth-utils";

/**
 * Record that the signed-in user opened the app today (IST), at most once per
 * user, org and day. The day already recorded is kept in the session cookie,
 * so this costs no database work on every other request that day.
 *
 * Admin "login as owner" sessions are skipped so support visits don't look
 * like the owner coming back.
 */
export async function recordDailyActivity(event: H3Event, session: UserSession, orgId: number) {
  const userId = session.user?.id;
  if (!userId || session.admin?.authenticated) return;

  const day = todayIST();
  const marker = `${orgId}:${day}`;
  if (session.activityDay === marker) return;

  const now = new Date().toISOString();
  try {
    await db.batch([
      db.insert(schema.userActivityDays)
        .values({ userId, orgId, day, createdAt: now })
        .onConflictDoNothing(),
      db.update(schema.users).set({ lastSeenAt: now }).where(eq(schema.users.id, userId)),
    ]);
    await setUserSession(event, { activityDay: marker });
  }
  catch (error) {
    // Tracking must never break the request it rides on.
    console.warn("Failed to record daily activity", error);
  }
}
