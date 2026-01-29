import type { H3Event } from "h3";
import { eq } from "drizzle-orm";
import { db, schema } from "@nuxthub/db";

export async function requireAuth(event: H3Event) {
  const session = await requireUserSession(event);
  return session.user;
}

export async function findUserByEmail(email: string) {
  const rows = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);
  return rows[0] || null;
}

export async function findUserByGoogleId(googleId: string) {
  const rows = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.googleId, googleId))
    .limit(1);
  return rows[0] || null;
}
