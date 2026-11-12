import { eq, sql } from "drizzle-orm";

export default defineOAuthGoogleEventHandler({
  async onSuccess(event, { user: googleUser }) {
    // Only trust the email if Google says it's verified; otherwise anyone could
    // claim an address and get linked to that person's account.
    if (!googleUser.email || googleUser.email_verified !== true) {
      return sendRedirect(event, "/login?error=oauth");
    }
    const email = String(googleUser.email).toLowerCase().trim();

    // Try to find by Google ID first
    let user = await findUserByGoogleId(googleUser.sub);
    let isNewUser = false;

    if (!user) {
      // Try to find by email and link
      user = await findUserByEmail(email);
      if (user) {
        // Email sign-up never verifies the address, so a password account with
        // this email may have been created by someone else before the real
        // owner arrived. Google has now proved who owns the email: drop that
        // password and bump the session version, which signs out every
        // session created with it.
        const takeover = Boolean(user.passwordHash) && !user.googleId;
        const [updated] = await db
          .update(schema.users)
          .set({
            googleId: googleUser.sub,
            ...(takeover
              ? { passwordHash: null, sessionVersion: sql`${schema.users.sessionVersion} + 1` }
              : {}),
          })
          .where(eq(schema.users.id, user.id))
          .returning();
        user = updated ?? user;
      } else {
        // Create new user
        isNewUser = true;
        const result = await db.insert(schema.users).values({
          email,
          name: googleUser.name || email,
          googleId: googleUser.sub,
          ...(await signupAttribution(event)),
        }).returning();
        user = result[0]!;
      }
    }

    if (!user) {
      return sendRedirect(event, "/login?error=oauth");
    }

    const orgs = await getUserOrgs(user.id);
    const currentOrg = orgs.length > 0 ? orgs[0] : undefined;

    // Replace (not merge) so nothing from a previous user's session survives.
    const previous = await getUserSession(event);
    await replaceUserSession(event, {
      admin: previous.admin,
      user: { id: user.id, email: user.email, name: user.name },
      currentOrg,
      sessionVersion: user.sessionVersion,
    });

    const destination = orgs.length > 1
      ? "/outlets"
      : currentOrg ? "/dashboard" : isNewUser ? "/onboarding?signup=google" : "/onboarding";
    return sendRedirect(event, destination);
  },
  onError(event, error) {
    console.error("Google OAuth error:", error);
    return sendRedirect(event, "/login?error=oauth");
  },
});
