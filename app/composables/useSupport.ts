/**
 * MemberBook's own support channels (not an org's members). Values come from
 * runtimeConfig.public so they can be changed with env vars without a code change.
 */
export function useSupport() {
  const config = useRuntimeConfig().public;

  const whatsappNumber = computed(() => String(config.supportWhatsappNumber || "").replace(/\D/g, ""));
  const email = computed(() => String(config.supportEmail || "").trim());
  const hours = computed(() => String(config.supportHours || "").trim());

  // "919137849812" -> "+91 91378 49812"
  const whatsappDisplay = computed(() => {
    const n = whatsappNumber.value;
    if (n.length === 12 && n.startsWith("91")) {
      return `+91 ${n.slice(2, 7)} ${n.slice(7)}`;
    }
    return n ? `+${n}` : "";
  });

  function whatsappLink(message?: string) {
    if (!whatsappNumber.value) return "";
    const base = `https://wa.me/${whatsappNumber.value}`;
    return message ? `${base}?text=${encodeURIComponent(message)}` : base;
  }

  function helpMessage(orgName?: string | null) {
    return orgName
      ? `Hi MemberBook team, I need help with ${orgName}.\n\n`
      : "Hi MemberBook team, I need help.\n\n";
  }

  function emailLink(subject?: string) {
    if (!email.value) return "";
    return subject ? `mailto:${email.value}?subject=${encodeURIComponent(subject)}` : `mailto:${email.value}`;
  }

  return { whatsappNumber, whatsappDisplay, email, hours, whatsappLink, helpMessage, emailLink };
}
