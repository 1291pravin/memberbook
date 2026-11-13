/**
 * The add-on services a business can switch on from /dashboard/add-ons.
 *
 * `ready: false` add-ons show as "coming soon" with a "tell me when it's
 * ready" button. An admin can still switch one on for a single business
 * (org_add_ons.admin_enabled) to test it before it opens to everyone, which is
 * how every add-on is feature-flagged.
 *
 * Prices are in paise a month. Every paid add-on starts with a free month.
 */
export type AddOnKey =
  | "website"
  | "reviews"
  | "self_check_in"
  | "auto_reminders"
  | "own_number"
  | "front_desk"
  | "diet_plans"
  | "telecaller";

export interface AddOnDef {
  key: AddOnKey;
  name: string;
  /** One line under the name. */
  tagline: string;
  /** What the owner gets, as short points. */
  points: string[];
  price: number;
  /**
   * Paid upfront, no free month: switching on creates a bill straight away and
   * the add-on only works once the admin verifies the UPI payment, then for
   * PREPAID_DAYS per payment. Used where we pay a cost per use (Meta per message).
   */
  prepaid?: boolean;
  ready: boolean;
  /** Why it isn't ready yet, for the admin. */
  waitingOn?: string;
  /** Business types it makes sense for; empty = all. */
  forTypes?: string[];
  /** Page in the app where the owner uses it, once switched on. */
  page?: string;
}

export const FREE_TRIAL_DAYS = 30;

/** Days of service one prepaid payment buys. */
export const PREPAID_DAYS = 30;

/** A renewal bill for a prepaid add-on appears this many days before it runs out. */
export const PREPAID_RENEW_DAYS_BEFORE = 3;

/**
 * WhatsApp reminders a business can send each month (IST calendar month) from
 * MemberBook's number with the auto_reminders add-on. Meta charges us about
 * ₹0.14 per utility message with GST, so 500 costs us about ₹70 of the ₹199.
 * Sending stops at the limit; reminders from the business's own number don't
 * count (Meta bills them directly). The add-on is prepaid: no free month,
 * because Meta bills us from the first message.
 */
export const INCLUDED_REMINDERS = 500;


export const ADD_ONS: AddOnDef[] = [
  {
    key: "website",
    name: "Your own website",
    tagline: "A website made for your business, with your photos, plans and prices.",
    points: [
      "Built for you from your details and photos",
      "Members can add it to their phone like an app",
      "Enquiries from the site come straight into MemberBook",
      "Tell us any change and we'll make it",
    ],
    price: 29900,
    ready: true,
    page: "/dashboard/add-ons/website",
  },
  {
    key: "reviews",
    name: "Google review help",
    tagline: "Replies written for your Google reviews, and a monthly summary of what members say.",
    points: [
      "Paste a review, get a polite reply to post",
      "Monthly summary: what members love and what to fix",
      "Ask your members for reviews in one tap",
    ],
    price: 19900,
    ready: true,
    page: "/dashboard/add-ons/reviews",
  },
  {
    key: "self_check_in",
    name: "Member self check-in",
    tagline: "A QR poster at your door. Members scan it to check in.",
    points: [
      "No staff needed at the desk",
      "Members see their streak, so they keep coming",
      "See who has stopped coming before they quit",
    ],
    price: 0,
    ready: true,
    page: "/dashboard/add-ons/check-in",
  },
  {
    key: "auto_reminders",
    name: "Automatic fee reminders",
    tagline: "We send fee reminders on WhatsApp every morning, so you don't have to.",
    points: [
      "Sent from the MemberBook WhatsApp number with your business name",
      "Each reminder has a pay link to your UPI ID",
      `Up to ${INCLUDED_REMINDERS} reminders a month included`,
      "Paid upfront each month. Starts once we confirm your payment",
    ],
    price: 19900,
    prepaid: true,
    ready: true,
    page: "/dashboard/collections",
  },
  {
    key: "own_number",
    name: "Reminders from your own WhatsApp",
    tagline: "The same automatic reminders, sent from your own WhatsApp Business number.",
    points: [
      "Members see your number, not ours",
      "Keep using the WhatsApp Business app as usual",
      "Connect in two minutes with your Facebook login",
    ],
    price: 49900,
    ready: false,
    waitingOn: "Meta Tech Provider app review (embedded signup is built; switch on per business to test)",
    page: "/dashboard/add-ons/whatsapp",
  },
  {
    key: "front_desk",
    name: "AI front desk on WhatsApp",
    tagline: "Answers enquiries, books trial visits and follows up, day and night.",
    points: [
      "Replies to new enquiries in seconds",
      "Books trial visits and reminds them to come",
      "Hands over to you when it's not sure",
    ],
    price: 49900,
    ready: false,
    waitingOn: "Meta Tech Provider status (needs the owner's own number)",
  },
  {
    key: "diet_plans",
    name: "Diet and workout plans",
    tagline: "Personal diet and workout plans for your members, sent on WhatsApp.",
    points: [
      "Members share their goal and weight with their consent",
      "Plans updated every month",
      "Offer it as a premium to your members",
    ],
    price: 49900,
    ready: false,
    waitingOn: "WhatsApp sending, member consent flow",
    forTypes: ["gym"],
  },
  {
    key: "telecaller",
    name: "AI phone calls",
    tagline: "A friendly AI voice calls members who haven't paid or haven't come in.",
    points: ["Reminder calls in Hindi or English", "You get a summary of every call"],
    price: 0,
    ready: false,
    waitingOn: "Later: voice provider and calling rules",
  },
];

export const ADD_ON_KEYS = ADD_ONS.map(a => a.key);

export function getAddOn(key: string): AddOnDef | undefined {
  return ADD_ONS.find(a => a.key === key);
}

export function addOnsForType(type: string | null | undefined) {
  return ADD_ONS.filter(a => !a.forTypes?.length || (type && a.forTypes.includes(type)));
}

/** Details the owner confirms for their website. All optional except the name. */
export interface WebsiteDetails {
  businessName?: string;
  tagline?: string;
  about?: string;
  address?: string;
  area?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  hours?: string;
  googleMapsUrl?: string;
  instagram?: string;
  facilities?: string;
  trainers?: string;
  offers?: string;
  colours?: string;
  notes?: string;
  /** "I already have a website": we don't build one, just record it. */
  existingWebsite?: string;
}

export const WEBSITE_DETAIL_KEYS: (keyof WebsiteDetails)[] = [
  "businessName", "tagline", "about", "address", "area", "phone", "whatsapp", "email", "hours",
  "googleMapsUrl", "instagram", "facilities", "trainers", "offers", "colours", "notes", "existingWebsite",
];

export const SERVICE_REQUEST_TYPES = ["website_build", "website_change", "review_reply", "review_summary"] as const;
export type ServiceRequestType = typeof SERVICE_REQUEST_TYPES[number];
