/** "Reminders from your own WhatsApp": connection state and what the signup popup needs. */
export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const [active, account, org] = await Promise.all([
    isAddOnActive(access.orgId, "own_number"),
    getOwnAccount(access.orgId),
    getOrgCollectionSettings(access.orgId),
  ]);
  const signup = embeddedSignupConfig();
  return {
    active,
    signup: { appId: signup.appId, configId: signup.configId, ready: signup.ready },
    account: serializeOwnAccount(account),
    autoRemindersEnabled: Boolean(org?.autoRemindersEnabled),
    hasUpiId: Boolean(org?.upiId),
  };
});
