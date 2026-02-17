<template>
  <div>
    <!-- Hero -->
    <section class="py-12 px-4 bg-slate-50 border-b border-slate-200">
      <div class="max-w-5xl mx-auto">
        <!-- Breadcrumb -->
        <nav class="mb-4 text-sm text-slate-500" aria-label="Breadcrumb">
          <ol class="flex items-center gap-1.5">
            <li>
              <NuxtLink to="/" class="hover:text-slate-700 transition-colors">Home</NuxtLink>
            </li>
            <li aria-hidden="true">›</li>
            <li>
              <NuxtLink to="/tools" class="hover:text-slate-700 transition-colors">Free Tools</NuxtLink>
            </li>
            <li aria-hidden="true">›</li>
            <li class="text-slate-700 font-medium" aria-current="page">WhatsApp Renewal Reminder</li>
          </ol>
        </nav>

        <h1 class="text-3xl md:text-4xl font-bold text-slate-800 mb-3">
          Free WhatsApp Gym Membership Renewal Reminder Generator
        </h1>
        <p class="text-lg text-slate-600 max-w-2xl">
          Generate personalized renewal reminders in seconds. Supports English &amp; Hinglish. Free forever.
        </p>
      </div>
    </section>

    <!-- Tool Section -->
    <section class="py-10 px-4">
      <div class="max-w-5xl mx-auto">
        <div class="grid md:grid-cols-2 gap-8">
          <!-- Left: Form -->
          <div class="space-y-5">
            <h2 class="text-xl font-semibold text-slate-800">Customise Your Message</h2>

            <!-- Gym Name -->
            <div>
              <label for="gym-name" class="block text-sm font-medium text-slate-700 mb-1">Gym Name</label>
              <input
                id="gym-name"
                v-model="form.gymName"
                type="text"
                placeholder="Power Fitness Gym"
                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-slate-500"
              >
            </div>

            <!-- Member Name -->
            <div>
              <label for="member-name" class="block text-sm font-medium text-slate-700 mb-1">Member Name</label>
              <input
                id="member-name"
                v-model="form.memberName"
                type="text"
                placeholder="Rahul Sharma"
                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-slate-500"
              >
            </div>

            <!-- Expiry Date -->
            <div>
              <label for="expiry-date" class="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label>
              <input
                id="expiry-date"
                v-model="form.expiryDate"
                type="date"
                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
            </div>

            <!-- Plan Name -->
            <div>
              <label for="plan-name" class="block text-sm font-medium text-slate-700 mb-1">Plan Name</label>
              <input
                id="plan-name"
                v-model="form.planName"
                type="text"
                placeholder="Monthly Fitness Plan"
                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-slate-500"
              >
            </div>

            <!-- Renewal Amount -->
            <div>
              <label for="amount" class="block text-sm font-medium text-slate-700 mb-1">Renewal Amount</label>
              <div class="flex">
                <span class="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 text-slate-600 text-sm font-medium select-none">
                  ₹
                </span>
                <input
                  id="amount"
                  v-model="form.amount"
                  type="number"
                  min="0"
                  placeholder="1500"
                  class="flex-1 border border-slate-300 rounded-r-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-slate-500"
                >
              </div>
            </div>

            <!-- Offer / Discount (optional) -->
            <div>
              <label for="offer" class="block text-sm font-medium text-slate-700 mb-1">
                Special Offer
                <span class="text-slate-500 font-normal">(optional)</span>
              </label>
              <input
                id="offer"
                v-model="form.offer"
                type="text"
                placeholder="10% off if renewed in 3 days"
                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-slate-500"
              >
            </div>

            <!-- Language Toggle -->
            <div>
              <span class="block text-sm font-medium text-slate-700 mb-2">Message Language</span>
              <div class="flex rounded-lg overflow-hidden border border-slate-300 w-fit">
                <button
                  type="button"
                  :class="language === 'english'
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                  class="px-5 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
                  @click="language = 'english'"
                >
                  English
                </button>
                <button
                  type="button"
                  :class="language === 'hinglish'
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                  class="px-5 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
                  @click="language = 'hinglish'"
                >
                  Hinglish
                </button>
              </div>
            </div>
          </div>

          <!-- Right: Preview -->
          <div class="flex flex-col gap-4">
            <h2 class="text-xl font-semibold text-slate-800">Message Preview</h2>

            <!-- WhatsApp-style bubble -->
            <div class="bg-[#E5DDD5] rounded-2xl p-4 min-h-64 flex items-start">
              <div
                class="bg-[#DCF8C6] rounded-2xl max-w-sm p-4 shadow-sm text-sm text-slate-800 leading-relaxed whitespace-pre-line"
                :class="isFormEmpty ? 'italic text-slate-500' : ''"
              >
                {{ isFormEmpty ? 'Fill in the form to preview your message here.' : message }}
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                :disabled="isFormEmpty"
                class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500"
                @click="copyMessage"
              >
                <span>{{ copied ? '✅' : '📋' }}</span>
                <span>{{ copied ? 'Copied!' : 'Copy Message' }}</span>
              </button>

              <a
                :href="whatsappUrl"
                target="_blank"
                rel="noopener noreferrer"
                :class="isFormEmpty ? 'pointer-events-none opacity-40' : ''"
                class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-500 text-white font-medium text-sm hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <span>📱</span>
                <span>Send via WhatsApp</span>
              </a>
            </div>

            <p class="text-xs text-slate-500">
              "Send via WhatsApp" opens WhatsApp Web or the app with the message pre-filled. No data is stored or sent to our servers.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Bulk Reminder Instructions -->
    <section class="py-10 px-4 bg-slate-50 border-t border-slate-200">
      <div class="max-w-5xl mx-auto">
        <h2 class="text-2xl font-bold text-slate-800 mb-2">Sending to Multiple Members?</h2>
        <p class="text-slate-600 mb-4">
          Use this template with WhatsApp Business broadcast lists or any bulk messaging tool. Replace the <code class="bg-slate-200 px-1 rounded text-sm">{placeholders}</code> with actual member values.
        </p>

        <div class="bg-white border border-slate-200 rounded-xl p-5 overflow-x-auto">
          <pre class="font-mono text-sm text-slate-700 whitespace-pre-wrap">Hi {member_name}, your membership at {gym_name} expires on {expiry_date}. Plan: {plan_name}, Amount: ₹{amount}. Renew now to keep your fitness streak going! - {gym_name} Team</pre>
        </div>

        <p class="mt-3 text-sm text-slate-500">
          Use this template in WhatsApp Business broadcast lists or any bulk messaging tool. Replace {placeholders} with actual values.
        </p>
      </div>
    </section>

    <!-- Conversion CTA -->
    <section class="py-10 px-4">
      <div class="max-w-5xl mx-auto">
        <div class="bg-primary-50 border border-primary-200 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p class="text-slate-800 text-base md:text-lg">
              Sending this to 80 members one by one?
              <strong class="text-slate-800">MemberBook shows you who's expiring this week</strong>
              — send pre-filled reminders in one click.
            </p>
          </div>
          <NuxtLink
            to="/register"
            class="shrink-0 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-primary-500 text-white font-semibold text-sm hover:bg-primary-600 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Try MemberBook Free →
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="py-10 px-4 bg-slate-50 border-t border-slate-200">
      <div class="max-w-3xl mx-auto">
        <h2 class="text-2xl font-bold text-slate-800 mb-8">Frequently Asked Questions</h2>

        <div class="space-y-6">
          <div
            v-for="faq in faqs"
            :key="faq.q"
            class="bg-white rounded-xl border border-slate-200 p-5"
          >
            <h3 class="font-semibold text-slate-800 mb-2">{{ faq.q }}</h3>
            <p class="text-slate-600 text-sm leading-relaxed">{{ faq.a }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "default" });

const config = useRuntimeConfig();
const appUrl = config.public.appUrl || "https://memberbook.app";

const PAGE_URL = `${appUrl}/tools/whatsapp-gym-renewal-reminder`;

useSeoMeta({
  title: "Free WhatsApp Gym Membership Renewal Reminder Generator",
  description:
    "Generate personalized WhatsApp renewal reminders for gym members. Supports English & Hinglish. Free, no sign-up needed. Copy & send in one click.",
  ogTitle: "Free WhatsApp Gym Membership Renewal Reminder Generator",
  ogDescription:
    "Generate personalized WhatsApp renewal reminders for gym members. Supports English & Hinglish. Free, no sign-up needed. Copy & send in one click.",
  ogImage: `${appUrl}/og-image.png`,
  ogUrl: PAGE_URL,
  ogType: "website",
  twitterCard: "summary_large_image",
  twitterTitle: "Free WhatsApp Gym Membership Renewal Reminder Generator",
  twitterDescription:
    "Generate personalized WhatsApp renewal reminders for gym members. Supports English & Hinglish. Free, no sign-up needed. Copy & send in one click.",
  twitterImage: `${appUrl}/og-image.png`,
});

useHead({
  link: [{ rel: "canonical", href: PAGE_URL }],
  script: [
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "WhatsApp Gym Membership Renewal Reminder Generator",
        description:
          "Free tool to generate personalized WhatsApp renewal reminders for gym members",
        url: PAGE_URL,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web Browser",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "INR",
        },
      }),
    },
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: appUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Free Tools",
            item: `${appUrl}/tools`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: "WhatsApp Renewal Reminder",
            item: PAGE_URL,
          },
        ],
      }),
    },
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "How do I send gym membership renewal reminders on WhatsApp?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "You can send renewal reminders on WhatsApp by composing a personalised message with the member's name, expiry date, plan, and renewal amount. WhatsApp Business lets you create message templates and broadcast to multiple contacts. For gyms with many members, a tool like MemberBook automates this by tracking expiry dates and letting you send pre-filled messages in one click.",
            },
          },
          {
            "@type": "Question",
            name: "What should I include in a gym membership expiry message?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "A good renewal reminder should include the member's name (personalisation increases response rates), the exact expiry date, the plan name, the renewal amount, and a clear call-to-action such as 'Reply to renew' or 'Visit us today'. If you have a time-limited offer or discount, mention it early in the message to drive urgency.",
            },
          },
          {
            "@type": "Question",
            name: "Can I send bulk renewal reminders to all gym members at once?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. WhatsApp Business allows broadcast lists of up to 256 contacts, and messages appear as individual chats rather than group messages. For larger gyms, MemberBook automates the process — it identifies expiring members, pre-fills their details into a WhatsApp message, and lets you send personalised reminders to hundreds of members without typing each one manually.",
            },
          },
          {
            "@type": "Question",
            name: "How do I write a gym fee reminder in Hindi or Hinglish?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "For Indian gym members, Hinglish (Hindi-English mix) messages often have higher open and response rates because they feel more personal and conversational. Use familiar phrases like 'Namaste', 'Aapki membership expire ho rahi hai', and 'Aaj hi renew karein'. This generator produces ready-to-send Hinglish messages — just switch the language toggle and copy the result.",
            },
          },
          {
            "@type": "Question",
            name: "What is the best time to send membership renewal reminders?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Send the first reminder 7 days before expiry so members have time to plan, a second reminder 3 days before to create gentle urgency, and a final reminder on the expiry day itself. Morning messages (9–11 AM) tend to get higher read rates. Avoid sending late at night. Consistent, timely follow-ups can reduce non-renewals by up to 40%.",
            },
          },
          {
            "@type": "Question",
            name: "How can I reduce gym membership non-renewals?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Timely reminders, easy payment options, and personalised messages are the top three factors in improving renewal rates. Send reminders 7 days, 3 days, and on the expiry day. Offer a small incentive for early renewal. Make it easy to pay — share a UPI QR code or payment link directly in the WhatsApp message. MemberBook helps by tracking all expiries and alerting you before members lapse.",
            },
          },
          {
            "@type": "Question",
            name: "Does MemberBook send automatic WhatsApp reminders?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. MemberBook tracks every member's expiry date and highlights who is expiring this week on your dashboard. You can send pre-filled WhatsApp messages with one click — no copy-pasting required. It works for gyms, libraries, and tuition centres, and is free to try with no credit card needed.",
            },
          },
        ],
      }),
    },
  ],
});

// --- Reactive state ---

const form = reactive({
  gymName: "",
  memberName: "",
  expiryDate: "",
  planName: "",
  amount: "",
  offer: "",
});

const language = ref<"english" | "hinglish">("english");
const copied = ref(false);

// --- Computed ---

const isFormEmpty = computed(
  () =>
    !form.gymName &&
    !form.memberName &&
    !form.expiryDate &&
    !form.planName &&
    !form.amount,
);

const formattedDate = computed(() => {
  if (!form.expiryDate) return "";
  const d = new Date(form.expiryDate + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
});

const message = computed(() => {
  const name = form.memberName || "[Member Name]";
  const gym = form.gymName || "[Gym Name]";
  const date = formattedDate.value || "[Expiry Date]";
  const plan = form.planName || "[Plan Name]";
  const amount = form.amount || "[Amount]";
  const offerLine = form.offer
    ? language.value === "english"
      ? `\n🎁 Special Offer: ${form.offer}`
      : `\n🎁 Special Offer: ${form.offer}`
    : "";

  if (language.value === "english") {
    return `Hi ${name} 👋

Your membership at ${gym} is expiring on ${date}.

Plan: ${plan}
Renewal Amount: ₹${amount}${offerLine}

Renew today to continue your fitness journey without interruption! 💪

Reply to this message or visit us to renew.

Thank you,
${gym} Team`;
  }

  return `Namaste ${name} 🙏

Aapki ${gym} membership ${date} ko expire ho rahi hai.

Plan: ${plan}
Renewal Amount: ₹${amount}${offerLine}

Aaj hi renew karein aur apna fitness journey continue rakhein! 💪

Renew karne ke liye reply karein ya humse milein.

Dhanyawad,
${gym} Team`;
});

const whatsappUrl = computed(
  () => `https://wa.me/?text=${encodeURIComponent(message.value)}`,
);

// --- Actions ---

async function copyMessage() {
  if (isFormEmpty.value) return;
  try {
    await navigator.clipboard.writeText(message.value);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {
    // Fallback for browsers that don't support clipboard API
    const el = document.createElement("textarea");
    el.value = message.value;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  }
}

// --- FAQ data ---

const faqs = [
  {
    q: "How do I send gym membership renewal reminders on WhatsApp?",
    a: "You can send renewal reminders on WhatsApp by composing a personalised message with the member's name, expiry date, plan, and renewal amount. WhatsApp Business lets you create message templates and broadcast to multiple contacts. For gyms with many members, a tool like MemberBook automates this by tracking expiry dates and letting you send pre-filled messages in one click.",
  },
  {
    q: "What should I include in a gym membership expiry message?",
    a: "A good renewal reminder should include the member's name (personalisation increases response rates), the exact expiry date, the plan name, the renewal amount, and a clear call-to-action such as 'Reply to renew' or 'Visit us today'. If you have a time-limited offer or discount, mention it early in the message to drive urgency.",
  },
  {
    q: "Can I send bulk renewal reminders to all gym members at once?",
    a: "Yes. WhatsApp Business allows broadcast lists of up to 256 contacts, and messages appear as individual chats rather than group messages. For larger gyms, MemberBook automates the process — it identifies expiring members, pre-fills their details into a WhatsApp message, and lets you send personalised reminders to hundreds of members without typing each one manually.",
  },
  {
    q: "How do I write a gym fee reminder in Hindi or Hinglish?",
    a: "For Indian gym members, Hinglish (Hindi-English mix) messages often have higher open and response rates because they feel more personal and conversational. Use familiar phrases like 'Namaste', 'Aapki membership expire ho rahi hai', and 'Aaj hi renew karein'. This generator produces ready-to-send Hinglish messages — just switch the language toggle and copy the result.",
  },
  {
    q: "What is the best time to send membership renewal reminders?",
    a: "Send the first reminder 7 days before expiry so members have time to plan, a second reminder 3 days before to create gentle urgency, and a final reminder on the expiry day itself. Morning messages (9–11 AM) tend to get higher read rates. Avoid sending late at night. Consistent, timely follow-ups can reduce non-renewals by up to 40%.",
  },
  {
    q: "How can I reduce gym membership non-renewals?",
    a: "Timely reminders, easy payment options, and personalised messages are the top three factors in improving renewal rates. Send reminders 7 days, 3 days, and on the expiry day. Offer a small incentive for early renewal. Make it easy to pay — share a UPI QR code or payment link directly in the WhatsApp message. MemberBook helps by tracking all expiries and alerting you before members lapse.",
  },
  {
    q: "Does MemberBook send automatic WhatsApp reminders?",
    a: "Yes. MemberBook tracks every member's expiry date and highlights who is expiring this week on your dashboard. You can send pre-filled WhatsApp messages with one click — no copy-pasting required. It works for gyms, libraries, and tuition centres, and is free to try with no credit card needed.",
  },
];
</script>
