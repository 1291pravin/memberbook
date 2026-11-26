/**
 * City landing pages: /library-software/<city>, /gym-software/<city>, /coaching-software/<city>.
 *
 * Honesty rule (same as guides.ts): never claim customers, reviews or numbers we don't have.
 * City context must be common knowledge (e.g. Kota is a coaching hub), and every page must
 * carry its own intro and FAQ, not just a swapped city name.
 */

export type LocalKind = "library" | "gym" | "coaching";

export interface LocalPage {
  kind: LocalKind;
  city: string; // display name
  slug: string; // URL segment
  state: string;
  intro: string; // unique, 2 to 3 sentences about this city and this kind of business
  faqs: { q: string; a: string }[];
}

export const kindInfo: Record<LocalKind, {
  path: string;
  title: (city: string) => string;
  metaTitle: (city: string) => string;
  description: (city: string) => string;
  people: string;
  place: string;
  placePlural: string;
  example: string; // fee plan example
  points: { title: string; text: string }[];
  guides: { slug: string; title: string }[];
}> = {
  library: {
    path: "library-software",
    title: city => `Library and study room management software in ${city}`,
    metaTitle: city => `Library Management Software in ${city}, Free | MemberBook`,
    description: city => `Free software for self-study libraries and reading rooms in ${city}. We load your students, seats and due dates for you, and send WhatsApp fee reminders with a UPI pay link.`,
    people: "students",
    place: "library",
    placePlural: "libraries and study rooms",
    example: "Full day ₹800, half day ₹500",
    points: [
      { title: "Seats and shifts in one list", text: "See which seat each student has, their shift, and when their fee is due, without flipping through the register." },
      { title: "Fee reminders on WhatsApp", text: "Each student gets a reminder before the due date with a UPI pay link. The money goes to your own UPI ID." },
      { title: "We set it up for you", text: "Send photos of your register or your Excel sheet. We load every student, seat and due date, free." },
    ],
    guides: [
      { slug: "self-study-library-fee-collection", title: "How to collect fees in a self-study library" },
      { slug: "library-seat-management-software", title: "Library seat management software" },
    ],
  },
  gym: {
    path: "gym-software",
    title: city => `Gym management software in ${city}`,
    metaTitle: city => `Gym Management Software in ${city}, Free | MemberBook`,
    description: city => `Free gym software for ${city}: members, plans and renewals in one place, WhatsApp renewal reminders with a UPI pay link, and free setup from your register.`,
    people: "members",
    place: "gym",
    placePlural: "gyms and fitness studios",
    example: "Monthly ₹1,000, quarterly ₹2,700",
    points: [
      { title: "Every renewal on one screen", text: "Each morning you see whose membership ends this week and who is already overdue." },
      { title: "Renewal reminders on WhatsApp", text: "Members get a WhatsApp reminder with a UPI pay link to your own UPI ID, so the money comes straight to you." },
      { title: "We set it up for you", text: "Send photos of your register or your Excel sheet. We load every member, plan and due date, free." },
    ],
    guides: [
      { slug: "gym-fee-reminder-message", title: "Gym fee reminder message templates" },
      { slug: "free-vs-paid-gym-software-india", title: "Free vs paid gym software in India" },
    ],
  },
  coaching: {
    path: "coaching-software",
    title: city => `Coaching class fee management software in ${city}`,
    metaTitle: city => `Coaching Fee Management Software in ${city}, Free | MemberBook`,
    description: city => `Free fee management for coaching classes and tuition centres in ${city}. Track every student's monthly or instalment fee, send WhatsApp reminders with a UPI pay link, and get free setup.`,
    people: "students",
    place: "coaching centre",
    placePlural: "coaching classes and tuition centres",
    example: "Monthly ₹1,500, or 3 instalments of ₹6,000",
    points: [
      { title: "Every student's fee status", text: "Students grouped by batch, with who has paid, who is due this week and who is overdue, for monthly fees or instalments." },
      { title: "Fee reminders on WhatsApp", text: "Students or parents get a polite reminder with a UPI pay link. The money goes to your own UPI ID." },
      { title: "We set it up for you", text: "Send photos of your fee register or your Excel sheet. We load every student, batch and due date, free." },
    ],
    guides: [
      { slug: "coaching-class-fee-management-software", title: "Coaching class fee management software" },
      { slug: "tuition-fee-reminder-message", title: "Tuition fee reminder message templates" },
    ],
  },
};

export const localPages: LocalPage[] = [
  {
    kind: "library", city: "Patna", slug: "patna", state: "Bihar",
    intro: "Patna has hundreds of self-study libraries where students preparing for BPSC, SSC, railway and banking exams rent a seat by the month. Most owners still keep fees in a register and chase payments one WhatsApp at a time.",
    faqs: [
      { q: "Can I manage full-day and half-day shifts?", a: "Yes. Make one plan per shift, for example full day and half day, and give each student a seat number. You see every seat and every due date in one list." },
      { q: "My register is in Hindi. Can you still load it?", a: "Yes. Send clear photos of each page and we type it in for you, including names written in Hindi." },
    ],
  },
  {
    kind: "library", city: "Delhi", slug: "delhi", state: "Delhi",
    intro: "From Mukherjee Nagar to Laxmi Nagar, Delhi's study libraries fill up with UPSC and SSC aspirants who pay monthly and move around a lot. Keeping track of who renewed and who left is the hard part.",
    faqs: [
      { q: "Students change seats and shifts often. Is that easy to update?", a: "Yes. Change the seat or plan on the student's page. Their next due date and reminder follow the new plan." },
      { q: "Can students pay online?", a: "Each reminder carries a UPI pay link to your own UPI ID. The student pays from any UPI app and you mark it paid." },
    ],
  },
  {
    kind: "library", city: "Lucknow", slug: "lucknow", state: "Uttar Pradesh",
    intro: "Lucknow's self-study libraries in areas like Aliganj, Kapoorthala and Indira Nagar serve students preparing for UPSSSC, UP Police and other exams. Monthly seat fees are small, so chasing each one by hand eats a lot of time.",
    faqs: [
      { q: "Is it really free?", a: "Yes. The app is free. Automatic WhatsApp reminders come with the optional Autopilot plan: 14 days free, then ₹199 a month." },
      { q: "Do I need a computer?", a: "No. MemberBook works on your phone's browser. You can add it to your home screen like an app." },
    ],
  },
  {
    kind: "library", city: "Jaipur", slug: "jaipur", state: "Rajasthan",
    intro: "Jaipur's study libraries, many of them near Gopalpura, Mansarovar and Lal Kothi, are full of RAS, REET and Patwari aspirants. Owners juggle seat bookings, shifts and monthly fees across a few hundred students.",
    faqs: [
      { q: "Can I see which seats are free?", a: "Yes. Every student has a seat number, so you can see at a glance which seats are taken and which are free." },
      { q: "How long does setup take?", a: "Send us your register on WhatsApp and we usually load it the same day." },
    ],
  },
  {
    kind: "library", city: "Indore", slug: "indore", state: "Madhya Pradesh",
    intro: "Indore's library and reading-room boom around Bhawarkuan and Vijay Nagar is driven by MPPSC and other exam aspirants. With students on different shifts and joining dates, fee dates are spread across the whole month.",
    faqs: [
      { q: "Students join on different dates. Does the app handle that?", a: "Yes. Each student's due date follows their own joining date and plan, and you see who is due each day." },
      { q: "Can I send receipts?", a: "Yes. You can share a payment receipt on WhatsApp when you record a fee." },
    ],
  },
  {
    kind: "library", city: "Prayagraj", slug: "prayagraj", state: "Uttar Pradesh",
    intro: "Prayagraj has long been a centre for competitive exam preparation, and self-study libraries around Civil Lines, Katra and Salori are part of daily life for aspirants. Owners often run more than one hall.",
    faqs: [
      { q: "I run two library branches. Can I manage both?", a: "Yes. Create one workspace per branch and switch between them from the same login." },
      { q: "What if a student stops coming?", a: "Mark them inactive. They stop getting reminders and drop off your due list, and their history stays saved." },
    ],
  },
  {
    kind: "gym", city: "Mumbai", slug: "mumbai", state: "Maharashtra",
    intro: "Mumbai gyms deal with members on monthly, quarterly and yearly plans, many of whom renew late. With hundreds of members, a renewal list on paper or in Excel goes out of date within a week.",
    faqs: [
      { q: "Can I add personal training packages?", a: "Yes. Make a plan for each package, and it gets its own price, duration and renewal date." },
      { q: "Will reminders come from my number?", a: "By default they come from the MemberBook WhatsApp number with your gym's name in the message. Sending from your own number is coming soon." },
    ],
  },
  {
    kind: "gym", city: "Pune", slug: "pune", state: "Maharashtra",
    intro: "Pune's gyms, from big fitness studios in Baner and Wakad to neighbourhood gyms in Kothrud and Hadapsar, run on renewals. Every member who forgets to renew is lost revenue.",
    faqs: [
      { q: "Can I see who has not renewed?", a: "Yes. Collections shows everyone overdue and everyone due in the next few days, with a tap to remind each of them." },
      { q: "Can MemberBook record check-ins?", a: "Yes. There's a simple self check-in link members can open at the front desk." },
    ],
  },
  {
    kind: "gym", city: "Hyderabad", slug: "hyderabad", state: "Telangana",
    intro: "Hyderabad's gyms in Kukatpally, Madhapur, Ameerpet and beyond see members join on any day of the month. That spreads renewals across every day, which is hard to track in a register.",
    faqs: [
      { q: "Can reminders go in Telugu?", a: "Reminders currently go in English with the member's name, amount and pay link. Write to us if you need another language." },
      { q: "Is my members' data safe?", a: "Each gym's data is kept separate and only you and the staff you add can see it." },
    ],
  },
  {
    kind: "gym", city: "Delhi", slug: "delhi", state: "Delhi",
    intro: "Delhi gyms run on a mix of monthly cash, UPI payments and long plans. Owners want one place that shows who has paid and whose plan ends this week.",
    faqs: [
      { q: "Can I record cash and UPI payments?", a: "Yes. Record any payment with its mode. UPI payments made from a reminder link go straight to your UPI ID." },
      { q: "Can my staff use it?", a: "Yes. Add staff to your gym so they can record payments and members, while you keep owner controls." },
    ],
  },
  {
    kind: "coaching", city: "Kota", slug: "kota", state: "Rajasthan",
    intro: "Kota is India's best-known coaching hub, and alongside the big institutes there are many smaller classes and tutors with batches of 20 to 200 students. Fees are often paid in instalments, and missed instalments are easy to lose track of.",
    faqs: [
      { q: "Can I track instalments?", a: "Yes. Record each instalment as it comes in and set the next due date, so the next reminder goes out on time." },
      { q: "Can reminders go to parents?", a: "Yes. Save the parent's WhatsApp number as the contact number and reminders go to them." },
    ],
  },
  {
    kind: "coaching", city: "Patna", slug: "patna", state: "Bihar",
    intro: "Patna's coaching classes, from Boring Road to Musallahpur Hat, teach thousands of students for board, JEE, NEET and government exams. Most collect monthly fees and keep track in a notebook.",
    faqs: [
      { q: "I have many batches. Can I see fees batch-wise?", a: "Yes. Give each student a batch, so you can see students and their fees batch by batch." },
      { q: "What does it cost?", a: "The app is free. Automatic reminders are optional: 14 days free, then ₹199 a month for up to 500 reminders." },
    ],
  },
  {
    kind: "coaching", city: "Delhi", slug: "delhi", state: "Delhi",
    intro: "Delhi's coaching and tuition centres, from Rajinder Nagar and Mukherjee Nagar to neighbourhood tuition classes, collect fees monthly or in parts. A clear list of who owes what saves awkward calls.",
    faqs: [
      { q: "Can I send a polite reminder instead of calling?", a: "Yes. Each reminder is a short, polite WhatsApp message with the amount and a UPI pay link." },
      { q: "Can you load my Excel sheet?", a: "Yes. Send your Excel or Google Sheet and we load every student, batch and due date for you, free." },
    ],
  },
];

export function getLocalPage(kind: LocalKind, slug: string) {
  return localPages.find(p => p.kind === kind && p.slug === slug) ?? null;
}

export function localPagePath(p: Pick<LocalPage, "kind" | "slug">) {
  return `/${kindInfo[p.kind].path}/${p.slug}`;
}
