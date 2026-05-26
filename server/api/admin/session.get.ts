export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  return {
    authenticated: Boolean(session.admin?.authenticated),
    loggedInAt: session.admin?.loggedInAt,
  };
});
