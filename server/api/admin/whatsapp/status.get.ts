// State of MemberBook's WhatsApp number in Meta, for the admin inbox.
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  return await getPhoneNumberStatus();
});
