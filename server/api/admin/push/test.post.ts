/** Send a test alert to every phone that has inbox alerts on. */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  return await sendAdminPush({
    title: "MemberBook inbox",
    body: "Alerts are working. New WhatsApp messages and emails will show up like this.",
    url: "/admin/inbox",
    tag: "test",
  });
});
