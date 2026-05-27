export default defineEventHandler(async (event) => {
  // Load the session into the request context so we can mutate it in place.
  await getUserSession(event);

  // Drop ONLY the admin flag while preserving any regular user session.
  //
  // We can't use setUserSession() here (it deep-merges via defu, which re-adds
  // the old `admin` object — even when passed `admin: undefined`, since defu
  // skips undefined values) nor replaceUserSession()/clearUserSession()+set
  // (clearing deletes the cached session, so the next read re-unseals the
  // original request cookie and restores `admin`). Instead we delete the key
  // from the already-cached session data, then re-seal without merging.
  const sessions = event.context.sessions as
    | Record<string, { data?: Record<string, unknown> }>
    | undefined;
  for (const name in sessions) {
    if (sessions[name]?.data) {
      delete sessions[name].data.admin;
    }
  }
  await setUserSession(event, {});

  await recordAdminAuditLog(event, "admin_logout");

  return { success: true };
});
