/** Body { addOn, action }: switch an add-on on or off, or ask to hear when it's ready. Owner only. */
export default defineEventHandler(async (event) => {
  const access = event.context.access;
  requireOwner(access);
  const body = await readBody<{ addOn?: string; action?: string }>(event);
  const key = String(body?.addOn || "") as AddOnKey;
  if (!getAddOn(key)) throw createError({ statusCode: 404, statusMessage: "Unknown add-on" });

  switch (body?.action) {
    case "start":
      await startAddOn(access.orgId, key);
      break;
    case "stop":
      await stopAddOn(access.orgId, key);
      break;
    case "notify":
      await notifyAddOn(access.orgId, key);
      break;
    default:
      throw createError({ statusCode: 400, statusMessage: "action must be start, stop or notify" });
  }
  const states = await getOrgAddOnStates(access.orgId);
  return states.find(s => s.key === key);
});
