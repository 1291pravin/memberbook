<template>
  <div class="min-h-screen bg-slate-50">
    <div class="max-w-4xl mx-auto px-4 py-12">
      <!-- Header -->
      <div class="mb-8">
        <NuxtLink to="/" class="text-primary-600 hover:text-primary-700 text-sm font-medium">
          ← Back to Home
        </NuxtLink>
        <h1 class="mt-4 text-3xl font-bold text-slate-800">Terms of Service</h1>
        <p class="mt-2 text-slate-600">Last updated: {{ lastUpdated }}</p>
      </div>

      <!-- Content -->
      <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-5 sm:p-8 space-y-6">
        <section v-for="(s, i) in sections" :key="s.title">
          <h2 class="text-xl font-semibold text-slate-800 mb-3">{{ i + 1 }}. {{ s.title }}</h2>
          <p v-for="p in s.paras ?? []" :key="p" class="text-slate-600 leading-relaxed mb-3 last:mb-0">{{ p }}</p>
          <ul v-if="s.items" class="list-disc list-inside text-slate-600 space-y-1 ml-4">
            <li v-for="item in s.items" :key="item.text">
              <strong v-if="item.label">{{ item.label }}:</strong> {{ item.text }}
            </li>
          </ul>
          <p v-if="s.after" class="mt-3 text-slate-600 leading-relaxed">{{ s.after }}</p>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-slate-800 mb-3">{{ sections.length + 1 }}. Contact</h2>
          <p class="text-slate-600 leading-relaxed">
            For questions about these Terms, bills or refunds, contact us at:
          </p>
          <div class="mt-3 text-slate-600">
            <p><strong>Email:</strong> <a href="mailto:support@memberbook.in" class="text-primary-600 hover:underline">support@memberbook.in</a></p>
            <p><strong>Website:</strong> <a :href="appUrl" class="text-primary-600 hover:underline">{{ appUrl.replace(/^https?:\/\//, "") }}</a></p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "default" });

const config = useRuntimeConfig();
const appUrl = config.public.appUrl || "https://memberbook.in";
const lastUpdated = "27 November 2026";

type Section = { title: string; paras?: string[]; items?: { label?: string; text: string }[]; after?: string };

const extraReminder = `${PLAN_EXTRA_REMINDER_PRICE} paise`;

const sections: Section[] = [
  {
    title: "Agreement",
    paras: [
      "These Terms are an agreement between you and MemberBook, a business registered in India. By creating an account or using MemberBook (\"the Service\"), you agree to them and to our Privacy Policy. If you use MemberBook for a business, you confirm you are allowed to accept these Terms for that business.",
    ],
  },
  {
    title: "The Service",
    paras: [
      "MemberBook helps gyms, libraries, coaching centres and similar businesses keep a member register, track fees, share pay links and receipts, and send WhatsApp reminders. We can also set up your account from your register, and on paid plans build a website and draft replies to Google reviews.",
    ],
  },
  {
    title: "Your account",
    items: [
      { text: "You must be 18 or older and give correct details." },
      { text: "Keep your password safe. You are responsible for what happens in your account, including actions by staff you add." },
      { text: "Tell us straight away at support@memberbook.in if you think someone else has used your account." },
    ],
  },
  {
    title: "Plans, trials and payment",
    items: [
      { label: "Free", text: "the core app (members, fees due, pay links, receipts, reminders you send yourself) is free." },
      { label: "Paid plans", text: "Autopilot and Pro are prepaid, monthly or yearly, at the prices shown on our website and in the app when you choose them. Prices include any taxes we have to charge." },
      { label: "Free trial", text: "each paid plan has a 14-day free trial, once per business. No payment details are needed to start one." },
      { label: "How to pay", text: "bills are paid by UPI to MemberBook. We never take money automatically; if a bill is not paid, the plan stops at the end of the paid period and your business moves to Free. Your data stays." },
      { label: "Extra reminders", text: `reminders beyond your plan's monthly allowance cost ${extraReminder} each and are added to your next bill.` },
      { label: "Changing plan", text: "if you switch plans, the paid days you have left carry over at the new plan's price." },
      { label: "Price changes", text: "we will tell you at least 30 days before a price change applies to you. It never changes a period you have already paid for." },
    ],
  },
  {
    title: "Refunds",
    paras: [
      "If you were charged by mistake, charged twice, or we could not deliver what you paid for, tell us within 30 days and we will refund it to the UPI account you paid from, usually within 7 working days. Otherwise prepaid periods are not refunded, but you can stop renewing at any time.",
    ],
  },
  {
    title: "Fees your members pay you",
    paras: [
      "Member payments go straight from your members to your own UPI ID or your own Razorpay account. MemberBook never holds that money and is not a party to your agreements with members. Refunds, disputes and receipts for your members' fees are between you and them.",
    ],
  },
  {
    title: "Your data and your members",
    items: [
      { text: "You own the data you add. You let us store and process it only to run the Service for you, as our Privacy Policy explains." },
      { text: "You must have the right to add your members' details and their permission to receive WhatsApp messages from or for your business (for members under 18, a parent's or guardian's permission)." },
      { text: "You are responsible for the accuracy of what you enter or ask us to send, such as amounts and due dates." },
      { text: "You can ask us for a copy of your members and payments at any time, and we will send it as a spreadsheet." },
    ],
  },
  {
    title: "WhatsApp messages",
    paras: [
      "Reminders and other messages go out through Meta's WhatsApp Business Platform, from MemberBook's number or from your own connected number, and must follow WhatsApp's Business and Commerce policies. Send only messages about your business to people who expect them. We may pause sending for a business if members complain, if Meta asks us to, or to protect the number for everyone. WhatsApp delivery depends on Meta and can sometimes be delayed or fail.",
    ],
  },
  {
    title: "Work done with AI",
    paras: [
      "Account setup from your files, websites, and review reply drafts are prepared with the help of AI and checked before use, but they can still contain mistakes. Please review what we load or draft. Review replies are drafts: you decide what gets posted.",
    ],
  },
  {
    title: "Acceptable use",
    paras: ["You agree not to:"],
    items: [
      { text: "break any law, or use MemberBook to send spam, harass anyone or mislead members;" },
      { text: "upload anything harmful, or content you have no right to use;" },
      { text: "try to access other businesses' data, or disrupt, overload or reverse-engineer the Service;" },
      { text: "scrape the Service or resell it without our written permission." },
    ],
  },
  {
    title: "Our content",
    paras: [
      "The MemberBook software, name, logo, website and guides belong to us. Websites and posters we make for your business are yours to use for that business while you are on the plan that includes them.",
    ],
  },
  {
    title: "Availability and changes",
    paras: [
      "We work to keep MemberBook running all the time but cannot promise it will never be down, for example during maintenance or outages at our providers. We may improve or change features; if we remove something important on a paid plan, we will tell you in advance and you may ask for a refund of the unused days.",
    ],
  },
  {
    title: "Limitation of liability",
    paras: [
      "The Service is provided \"as is\". To the extent the law allows, MemberBook is not liable for indirect or consequential losses, such as lost profits, lost fees or lost data. Our total liability for any claim is limited to the amount you paid us in the 12 months before the claim.",
    ],
  },
  {
    title: "Indemnity",
    paras: [
      "If someone makes a claim against MemberBook because of the data you added, messages you asked us to send, or your breach of these Terms, you agree to cover the reasonable costs of that claim.",
    ],
  },
  {
    title: "Closing your account",
    paras: [
      "You can stop using MemberBook at any time. To delete your account and data, email support@memberbook.in from your account email; we delete it within 30 days, as our Privacy Policy explains. We may suspend or close an account that breaks these Terms or puts others at risk, and will tell you why unless the law stops us.",
    ],
  },
  {
    title: "Changes to these Terms",
    paras: [
      "We may update these Terms. We will change the date above and tell account holders by email or in the app before important changes take effect. Continuing to use MemberBook after that means you accept the new Terms.",
    ],
  },
  {
    title: "Law and disputes",
    paras: [
      "These Terms are governed by the laws of India. Please contact us first so we can try to sort out any problem. If we cannot, the dispute will be settled by arbitration under the Arbitration and Conciliation Act, 1996, by a sole arbitrator, seated in Maharashtra, in English, and the courts of Maharashtra have jurisdiction.",
    ],
  },
];

useSeoMeta({
  title: "Terms of Service - MemberBook",
  description: "Terms for using MemberBook: free and paid plans, trials, UPI billing and refunds, WhatsApp messaging rules, your data, and how to close your account.",
  ogTitle: "Terms of Service - MemberBook",
  ogDescription: "Terms for using MemberBook: plans, trials, billing, refunds, WhatsApp messaging and your data.",
  robots: "index, follow",
});

useHead({
  link: [
    { rel: "canonical", href: `${appUrl}/terms` },
  ],
});
</script>
