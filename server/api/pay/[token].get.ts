// Public: the page a member opens from a WhatsApp reminder. Shows only what
// they need to pay: business name, their first name, plan and amount.
export default defineEventHandler(async (event) => {
  setHeader(event, "Cache-Control", "no-store");
  setHeader(event, "X-Robots-Tag", "noindex");
  const data = await loadPayLink(getRouterParam(event, "token") ?? "");
  if (!data) throw createError({ statusCode: 404, statusMessage: "This payment link is not valid" });

  const payeeName = data.upiPayeeName || data.orgName;
  const note = `${data.planName} - ${firstName(data.memberName)}`;
  return {
    orgName: data.orgName,
    memberFirstName: firstName(data.memberName),
    planName: data.planName,
    kind: data.link.kind,
    amount: Math.max(0, data.amount),
    paid: data.paid,
    claimed: !!data.link.claimedAt,
    upiId: data.upiId,
    payeeName,
    upiLink: data.upiId && !data.paid
      ? buildUpiLink({ upiId: data.upiId, payeeName, amount: data.amount, note })
      : null,
  };
});
