import { eq } from "drizzle-orm";

export default defineOAuthGoogleEventHandler({
  async onSuccess(event, { user: googleUser }) {
    // Try to find by Google ID first
    let user = await findUserByGoogleId(googleUser.sub);

    if (!user) {
      // Try to find by email and link
      user = await findUserByEmail(googleUser.email);
      if (user) {
        await db
          .update(schema.users)
          .set({ googleId: googleUser.sub })
          .where(eq(schema.users.id, user.id));
      } else {
        // Create new user
        const result = await db.insert(schema.users).values({
          email: googleUser.email,
          name: googleUser.name || googleUser.email,
          googleId: googleUser.sub,
        }).returning();
        user = result[0];
      }
    }

    const orgs = await getUserOrgs(user.id);
    const currentOrg = orgs.length > 0 ? orgs[0] : undefined;

    await setUserSession(event, {
      user: { id: user.id, email: user.email, name: user.name },
      currentOrg,
    });

    return sendRedirect(event, currentOrg ? "/dashboard" : "/onboarding");
  },
  onError(event, error) {
    console.error("Google OAuth error:", error);
    return sendRedirect(event, "/login?error=oauth");
  },
});
