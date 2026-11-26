/**
 * MemberBook's three plans. They replace the old add-ons menu: an owner picks
 * one plan instead of switching extras on one by one.
 *
 * Under the hood a paid plan is a prepaid row in org_add_ons, so billing,
 * trials, renewals and admin payment checks work exactly as they did for the
 * ₹199 reminders add-on:
 *   - Autopilot = the `auto_reminders` row (same key, so trials, referrals and
 *     paid periods carry over untouched)
 *   - Pro       = the `pro` row
 * A business is on Pro when its `pro` row is active, else on Autopilot when its
 * `auto_reminders` row is active, else on Free.
 *
 * Prices are in paise. Yearly = 10 months' price (2 months free).
 */
export type PlanKey = "free" | "autopilot" | "pro";
export type BillingCycle = "monthly" | "yearly";

export interface PlanFeature {
  text: string;
  /** Not live yet: shown as "coming soon". */
  soon?: boolean;
}

export interface PlanDef {
  key: PlanKey;
  name: string;
  /** One line under the name. */
  tagline: string;
  monthly: number;
  yearly: number;
  /** WhatsApp reminders a month from MemberBook's number (0 = sent by hand only). */
  reminders: number;
  /** org_add_ons key that holds this plan's state. */
  addOnKey: "auto_reminders" | "pro" | null;
  /** The plan below it, whose features it includes ("Everything in X, plus"). */
  includes?: PlanKey;
  features: PlanFeature[];
}

export const PLAN_TRIAL_DAYS = 14;

/** Paise per reminder past a paid plan's monthly allowance. */
export const PLAN_EXTRA_REMINDER_PRICE = 20;

export const PLANS: PlanDef[] = [
  {
    key: "free",
    name: "Free",
    tagline: "Everything you need to run the register. Free forever.",
    monthly: 0,
    yearly: 0,
    reminders: 0,
    addOnKey: null,
    features: [
      { text: "We set it up for you: send your register, we load it" },
      { text: "Members, plans and payments" },
      { text: "Fees due list and one-tap WhatsApp reminders you send" },
      { text: "UPI pay link for every member" },
      { text: "GST invoices, instalments and pausing" },
      { text: "Library seat map" },
      { text: "Free business page with an enquiry form" },
      { text: "Google review QR poster and member self check-in" },
    ],
  },
  {
    key: "autopilot",
    name: "Autopilot",
    tagline: "We send the fee reminders for you, every morning.",
    monthly: 19900,
    yearly: 199000,
    reminders: 500,
    addOnKey: "auto_reminders",
    includes: "free",
    features: [
      { text: "Automatic WhatsApp fee reminders, 500 a month" },
      { text: "Birthday wishes and \"we miss you\" messages" },
      { text: "Pay link to your UPI. Members tap \"I've paid\", you confirm in one tap" },
      { text: "Connect your Razorpay and payments mark themselves paid" },
    ],
  },
  {
    key: "pro",
    name: "Pro",
    tagline: "Autopilot, plus your website and Google reviews handled.",
    monthly: 49900,
    yearly: 499000,
    reminders: 1500,
    addOnKey: "pro",
    includes: "autopilot",
    features: [
      { text: "1,500 automatic reminders a month" },
      { text: "A ready-made website for your business" },
      { text: "Reply drafts for your Google reviews, for you to check and post" },
      { text: "AI replies to WhatsApp enquiries", soon: true },
      { text: "Send from your own WhatsApp number", soon: true },
    ],
  },
];

export function getPlanDef(key: string | null | undefined): PlanDef {
  return PLANS.find(p => p.key === key) ?? PLANS[0]!;
}

export function planPrice(plan: PlanDef, cycle: BillingCycle) {
  return cycle === "yearly" ? plan.yearly : plan.monthly;
}

/** Days one payment buys. */
export function cycleDays(cycle: BillingCycle) {
  return cycle === "yearly" ? 365 : 30;
}

/** Features that need the Pro plan (old add-on keys). */
export const PRO_FEATURES = ["website", "reviews", "own_number", "front_desk"] as const;
export type ProFeature = typeof PRO_FEATURES[number];

/** "₹1,990" from paise. */
export function planRupees(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}
