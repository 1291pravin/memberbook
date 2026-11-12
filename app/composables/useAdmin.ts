import { ref } from "vue";
import { navigateTo } from "#app";
import { useWhatsApp } from "./useWhatsApp";

// Shared formatting and actions for the admin panel pages.

export type Health = "setting_up" | "active" | "slipping" | "churned" | "new" | "never_started";

export interface AdminBusiness {
  id: number;
  name: string;
  type: string;
  createdAt: string;
  isTest: boolean;
  ownerId: number | null;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerWhatsapp: string | null;
  heldBySetup: boolean;
  upiSet: boolean;
  autoReminders: boolean;
  setupHelpAskedAt: string | null;
  setupHelpHandledAt: string | null;
  realMembers: number;
  plans: number;
  activeDays7: number;
  activeDays30: number;
  activeDaysTotal: number;
  lastVisitDay: string | null;
  lastActiveAt: string | null;
  daysSinceActive: number | null;
  membersAdded30: number;
  payments30: number;
  collected30: number;
  paymentsTotal: number;
  collectedTotal: number;
  checkins30: number;
  unpaidSubscriptions: number;
  reminders30: number;
  claimsWaiting: number;
  uploadsWaiting: number;
  lastUploadStatus: string | null;
  lastUploadAt: string | null;
  stage: string | null;
  followUpOn: string | null;
  followUpReason: string | null;
  lastNoteAt: string | null;
  health: Health;
}

export const HEALTH_META: Record<Health, { label: string; dot: string; help: string }> = {
  active: { label: "Active", dot: "bg-green-600", help: "Has members and was used in the last 7 days" },
  slipping: { label: "Slipping", dot: "bg-amber-500", help: "Has members, last used 8 to 21 days ago" },
  setting_up: { label: "Setting up", dot: "bg-primary-600", help: "We hold it for the owner, or their upload is waiting" },
  new: { label: "New", dot: "bg-sky-500", help: "Signed up in the last 14 days, no members yet" },
  churned: { label: "Churned", dot: "bg-red-600", help: "Has members, not used for more than 21 days" },
  never_started: { label: "Never started", dot: "bg-slate-400", help: "Signed up over 14 days ago, never added members" },
};

export const HEALTH_ORDER: Health[] = ["active", "slipping", "setting_up", "new", "churned", "never_started"];

const IST = "Asia/Kolkata";
const numberFmt = new Intl.NumberFormat("en-IN");
const rupeeFmt = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function useAdmin() {
  const { getWhatsAppLink } = useWhatsApp();

  function formatNumber(v: unknown) {
    return numberFmt.format(Number(v ?? 0));
  }
  function formatRupees(paise: unknown) {
    return rupeeFmt.format(Number(paise ?? 0) / 100);
  }
  function toDate(v: string) {
    return new Date(v.length === 10 ? `${v}T12:00:00+05:30` : v);
  }
  function formatDate(v: string | null | undefined, fallback = "Never") {
    if (!v) return fallback;
    const d = toDate(v);
    if (Number.isNaN(d.getTime())) return fallback;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: IST });
  }
  function formatDateTime(v: string | null | undefined) {
    if (!v) return "";
    return toDate(v).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: IST });
  }
  /** "today", "yesterday", "5 days ago", "3 months ago" */
  function ago(v: string | null | undefined, fallback = "Never") {
    if (!v) return fallback;
    const d = toDate(v);
    if (Number.isNaN(d.getTime())) return fallback;
    const today = new Date(new Date().toLocaleDateString("en-CA", { timeZone: IST }));
    const that = new Date(d.toLocaleDateString("en-CA", { timeZone: IST }));
    const days = Math.round((today.getTime() - that.getTime()) / 86400000);
    if (days <= 0) {
      const hours = Math.floor((Date.now() - d.getTime()) / 3600000);
      if (hours < 1) return "just now";
      return `${hours}h ago`;
    }
    if (days === 1) return "yesterday";
    if (days < 31) return `${days} days ago`;
    const months = Math.round(days / 30);
    return months < 12 ? `${months} ${months === 1 ? "month" : "months"} ago` : `${Math.round(days / 365)}y ago`;
  }

  function ownerWhatsAppLink(b: Pick<AdminBusiness, "ownerWhatsapp" | "ownerName" | "name">, message?: string) {
    if (!b.ownerWhatsapp) return null;
    const first = (b.ownerName || "").split(" ")[0] || "there";
    return getWhatsAppLink(b.ownerWhatsapp, message ?? `Hi ${first}, this is the MemberBook team. How is ${b.name} going with MemberBook? Anything we can help with?`);
  }

  const loggingInId = ref<number | null>(null);
  async function loginAsOwner(b: Pick<AdminBusiness, "id" | "ownerEmail">) {
    if (!b.ownerEmail) return;
    loggingInId.value = b.id;
    try {
      const result = await $fetch<{ redirectTo: string }>("/api/admin/autologin", {
        method: "POST",
        body: { email: b.ownerEmail, orgId: b.id },
      });
      await navigateTo(result.redirectTo || "/dashboard");
    }
    finally {
      loggingInId.value = null;
    }
  }

  return { formatNumber, formatRupees, formatDate, formatDateTime, ago, ownerWhatsAppLink, loginAsOwner, loggingInId };
}

export function errorMessage(err: unknown, fallback: string) {
  const e = err as { data?: { statusMessage?: string }; statusMessage?: string };
  return e?.data?.statusMessage || e?.statusMessage || fallback;
}
