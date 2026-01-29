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

    await setUserSession(event, {
      user: { id: user.id, email: user.email, name: user.name },
    });

    return sendRedirect(event, "/dashboard");
  },
  onError(event, error) {
    console.error("Google OAuth error:", error);
    return sendRedirect(event, "/login?error=oauth");
  },
});
