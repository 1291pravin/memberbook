<template>
  <div class="min-h-screen bg-slate-50">
    <div class="max-w-4xl mx-auto px-4 py-12">
      <!-- Header -->
      <div class="mb-8">
        <NuxtLink to="/" class="text-primary-600 hover:text-primary-700 text-sm font-medium">
          ← Back to Home
        </NuxtLink>
        <h1 class="mt-4 text-3xl font-bold text-slate-800">Privacy Policy</h1>
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
          <h2 class="text-xl font-semibold text-slate-800 mb-3">{{ sections.length + 1 }}. Contact and grievance officer</h2>
          <p class="text-slate-600 leading-relaxed">
            For any privacy question, a request about your data, or a complaint, write to our Grievance Officer. We reply within 2 working days and resolve requests within 30 days.
          </p>
          <div class="mt-3 text-slate-600">
            <p><strong>Grievance Officer, MemberBook</strong></p>
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

const sections: Section[] = [
  {
    title: "Who we are",
    paras: [
      "MemberBook (\"we\", \"our\", \"us\") is software made in India for gyms, libraries, coaching centres and similar businesses to manage members, collect fees and send reminders. This policy explains what we collect, why, who we share it with, and the choices you have. It follows India's Digital Personal Data Protection Act, 2023 and the IT Act, 2000.",
      "There are two kinds of people whose data we handle: business owners and their staff who use MemberBook (\"you\"), and the members, students or parents that a business adds (\"members\"). For member data, the business decides what to collect and why; we store and process it on the business's behalf and only to run the service for them.",
    ],
  },
  {
    title: "Information we collect",
    items: [
      { label: "Your account", text: "name, email, password (stored only as a secure hash) or your Google sign-in, and the businesses you belong to." },
      { label: "Your business", text: "business name, type, address, phone, logo and photos, your UPI ID, GST details if you add them, plans and prices." },
      { label: "Member records you add", text: "names, phone numbers, photos, birthdays, plans, due dates, payments, attendance, seats and enquiries." },
      { label: "Files you send us", text: "registers, photos and spreadsheets you upload so we can set up your account." },
      { label: "Messages", text: "WhatsApp messages and emails sent to MemberBook's support number and support@memberbook.in, and replies to reminders." },
      { label: "Payments", text: "records of fees your members pay you and of bills you pay us. If you connect your own Razorpay account, your key secret is stored encrypted and never shown in the browser. We never see or store card or bank details." },
      { label: "Usage and device data", text: "pages visited, features used, browser, device, approximate location from your IP address, and how you found us (for example a search or a link)." },
    ],
  },
  {
    title: "How we use it",
    items: [
      { text: "To run MemberBook for you: keep your member register, show fees due, make receipts and pay links, and send the reminders and messages you switch on." },
      { text: "To set up your account from the files you upload, and to build websites, posters and review reply drafts you ask for." },
      { text: "To answer your questions on WhatsApp and email, and to send you account emails such as welcome, trial and bill notices." },
      { text: "To keep the service safe: prevent spam, abuse and fraud, and fix problems." },
      { text: "To understand which pages and features help, so we can improve them." },
    ],
    after: "We do not sell personal data, and we do not use member data to advertise to members or to anyone else.",
  },
  {
    title: "Messages we send to members",
    paras: [
      "When a business switches on reminders, MemberBook sends fee reminders, receipts, birthday wishes and similar messages to its members on WhatsApp, on the business's behalf, through Meta's WhatsApp Business Platform. The business is responsible for having its members' permission to message them. A member who does not want these messages can tell the business or reply to us, and we will stop.",
    ],
  },
  {
    title: "Use of AI",
    paras: [
      "We use AI services (currently Anthropic's Claude) to read the registers and files you upload, to draft websites and review replies, and to answer messages sent to our support number and email. The AI only gets the data that task needs. People at MemberBook check website drafts before they go live, and money disputes or complaints are always handed to a person.",
    ],
  },
  {
    title: "Who we share data with",
    paras: ["We share data only with service providers that help us run MemberBook, and only what each one needs:"],
    items: [
      { label: "Cloudflare", text: "hosting, database, file storage and email routing." },
      { label: "Meta (WhatsApp)", text: "to send and receive WhatsApp messages." },
      { label: "Google", text: "Google sign-in and Google Analytics (website visit statistics)." },
      { label: "Resend", text: "to send emails from support@memberbook.in." },
      { label: "Anthropic", text: "AI processing described above." },
      { label: "Razorpay", text: "only if a business connects its own Razorpay account to take online payments." },
    ],
    after: "We may also share data when the law requires it, to protect people from harm or fraud, or with a buyer if MemberBook is ever sold (under this same policy).",
  },
  {
    title: "Cookies",
    paras: [
      "We use a sign-in cookie that keeps you logged in; the app cannot work without it. On our public website we also use Google Analytics cookies to count visits and see which pages help. We do not use advertising cookies. You can block or delete cookies in your browser settings; the website will still work, but you will need to log in again.",
    ],
  },
  {
    title: "Where data is stored and how we protect it",
    paras: [
      "Data is stored with Cloudflare; the main database is in the Asia-Pacific region. Some providers above may process data outside India under their own safeguards.",
      "All traffic uses HTTPS, passwords are hashed, secret keys are encrypted, and each business can only see its own data. No system is perfectly secure, so if we ever learn of a breach that affects you, we will tell you and the authorities as the law requires.",
    ],
  },
  {
    title: "How long we keep data",
    paras: [
      "We keep your data while your account is open. If you ask us to delete your account, we delete or anonymise your business and member data within 30 days, except records we must keep by law, such as bills and payment records for tax purposes.",
    ],
  },
  {
    title: "Your rights",
    paras: ["You can ask us to:"],
    items: [
      { text: "show you the personal data we hold about you, and who we shared it with;" },
      { text: "correct or update it;" },
      { text: "delete it, or withdraw consent you gave earlier;" },
      { text: "name someone to exercise these rights for you if you cannot;" },
      { text: "hear and resolve a complaint (see the grievance officer below). You may also approach the Data Protection Board of India." },
    ],
    after: "Members of a business should first contact that business, since it controls their records. We will help the business answer, or you can write to us directly.",
  },
  {
    title: "Children",
    paras: [
      "MemberBook accounts are for people aged 18 and over. Coaching centres and libraries may add students under 18 as members; the business must have a parent's or guardian's permission to add them and to send them messages. We do not knowingly market to children or track them for advertising.",
    ],
  },
  {
    title: "Changes to this policy",
    paras: [
      "If we change this policy, we will update the date above, and tell account holders by email or in the app when the change is important.",
    ],
  },
];

useSeoMeta({
  title: "Privacy Policy - MemberBook",
  description: "How MemberBook collects, uses, shares and protects data of business owners and their members, and how to reach our grievance officer.",
  ogTitle: "Privacy Policy - MemberBook",
  ogDescription: "How MemberBook collects, uses, shares and protects data of business owners and their members.",
  robots: "index, follow",
});

useHead({
  link: [
    { rel: "canonical", href: `${appUrl}/privacy` },
  ],
});
</script>
