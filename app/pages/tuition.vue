<template>
  <div>
    <!-- Hero -->
    <section class="py-16 px-4 text-center bg-gradient-to-b from-primary-50 to-white">
      <div class="max-w-3xl mx-auto">
        <h1 class="text-4xl font-bold text-slate-800 sm:text-5xl">
          Tuition Center Management
          <span class="text-primary-600">Made Easy</span>
        </h1>
        <p class="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
          Send us your student register or Excel sheet. We load every student, batch and fee date into MemberBook for free, and set up WhatsApp fee reminders to parents with your UPI ID.
        </p>
        <div class="mt-8 flex flex-wrap gap-3 justify-center">
          <a :href="setupLink" :target="setupLink.startsWith('http') ? '_blank' : undefined" rel="noopener">
            <AppButton size="lg">Send us your register</AppButton>
          </a>
          <NuxtLink to="/register">
            <AppButton size="lg" variant="secondary">Set it up myself</AppButton>
          </NuxtLink>
        </div>
        <p class="mt-4 text-sm text-slate-600">Free forever, with free setup. We load your students, batches and fee dates for you.</p>
      </div>
    </section>

    <!-- Problems We Solve -->
    <section class="py-16 px-4 bg-slate-50">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-3xl font-bold text-center text-slate-800 mb-12">Common tuition center challenges</h2>
        <div class="grid md:grid-cols-2 gap-6">
          <div v-for="problem in problems" :key="problem.title" class="bg-white rounded-xl p-6 border-l-4 border-red-500">
            <h3 class="font-semibold text-slate-800 mb-2">❌ {{ problem.title }}</h3>
            <p class="text-sm text-slate-600">{{ problem.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Features for Tuition Centers -->
    <section class="py-16 px-4">
      <div class="max-w-5xl mx-auto">
        <h2 class="text-3xl font-bold text-center text-slate-800 mb-12">Everything your coaching center needs</h2>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div v-for="feature in tuitionFeatures" :key="feature.title" class="text-center">
            <div class="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span class="text-3xl">{{ feature.emoji }}</span>
            </div>
            <h3 class="font-semibold text-slate-800 mb-2">{{ feature.title }}</h3>
            <p class="text-sm text-slate-600">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Use Cases -->
    <section class="py-16 px-4 bg-primary-50">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-3xl font-bold text-center text-slate-800 mb-4">Perfect for all types of coaching centers</h2>
        <p class="text-center text-slate-600 mb-12">Whether you teach one subject or run a full coaching institute.</p>
        <div class="grid md:grid-cols-4 gap-6">
          <div v-for="type in tuitionTypes" :key="type.name" class="bg-white rounded-xl p-6 text-center">
            <div class="text-4xl mb-3">{{ type.emoji }}</div>
            <h3 class="font-semibold text-slate-800 text-sm">{{ type.name }}</h3>
          </div>
        </div>
      </div>
    </section>

    <!-- Benefits -->
    <section class="py-16 px-4">
      <div class="max-w-3xl mx-auto">
        <h2 class="text-3xl font-bold text-center text-slate-800 mb-12">Why tuition centers love MemberBook</h2>
        <div class="space-y-6">
          <div v-for="benefit in benefits" :key="benefit.title" class="flex gap-4 items-start">
            <div class="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span class="text-green-600 text-xl">✓</span>
            </div>
            <div>
              <h3 class="font-semibold text-slate-800 mb-1">{{ benefit.title }}</h3>
              <p class="text-slate-600">{{ benefit.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonial -->
    <section class="py-16 px-4 bg-slate-50">
      <div class="max-w-2xl mx-auto text-center">
        <div class="text-5xl mb-4">💬</div>
        <blockquote class="text-lg text-slate-700 italic mb-4">
          "Before MemberBook, I was spending 2 hours daily managing student records and sending fee reminders. Now it takes just 10 minutes. I can focus more on teaching."
        </blockquote>
        <div class="font-semibold text-slate-800">Rajesh Kumar</div>
        <div class="text-sm text-slate-600">Math Coaching Center, Delhi</div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-16 px-4 text-center bg-slate-800 text-white">
      <div class="max-w-xl mx-auto">
        <h2 class="text-3xl font-bold mb-4">Ready to simplify your tuition center?</h2>
        <p class="text-lg text-slate-400 mb-8">
          Join coaching centers across India. Start managing students the smart way.
        </p>
        <NuxtLink to="/register">
          <AppButton size="lg" class="bg-white text-slate-800 hover:bg-slate-100">Start free</AppButton>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "default" });

const config = useRuntimeConfig();
const { setupHref } = useSupport();
const setupLink = computed(() => setupHref("Hi MemberBook team, I want you to set up my coaching centre register.\n\nCoaching centre name:\nCity:\nNumber of students (approx):\n\nI'll send photos of the register / Excel sheet next."));
const appUrl = config.public.appUrl || "https://memberbook.in";

useSeoMeta({
  title: "Coaching & Tuition Fee Management Software India | MemberBook",
  description: "Fee management for coaching classes and tuition centres in India, set up for you for free. We load students and batches, and set up WhatsApp fee reminders to parents with UPI.",
  ogTitle: "Tuition Center Management Software Made Simple - MemberBook",
  ogDescription: "Manage students, track fees, and handle batches effortlessly. Perfect for coaching classes and tuition centers in India.",
  ogImage: `${appUrl}/og-image.png`,
  ogUrl: `${appUrl}/tuition`,
  ogType: "website",
  twitterCard: "summary_large_image",
  twitterTitle: "Tuition Center Management Software for India",
  twitterDescription: "Track students, collect fees, send WhatsApp reminders. Built for Indian coaching classes.",
  twitterImage: `${appUrl}/og-image.png`,
});

useHead({
  link: [
    { rel: "canonical", href: `${appUrl}/tuition` },
  ],
  script: [
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "MemberBook Tuition Center Management Software",
        "applicationCategory": "BusinessApplication",
        "applicationSubCategory": "Education Management Software",
        "operatingSystem": "Web Browser",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "INR",
        },
        "description": "Simple student and fee management software for Indian coaching classes and tuition centers. Track students, collect fees, and manage batches.",
        "featureList": [
          "Student management",
          "Fee collection",
          "Batch management",
          "WhatsApp reminders",
          "Attendance tracking",
          "Payment analytics",
        ],
      }),
    },
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": appUrl,
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Tuition Center Management",
            "item": `${appUrl}/tuition`,
          },
        ],
      }),
    },
  ],
});

const problems = [
  { title: "Fee tracking nightmare", description: "Remembering who paid, who's pending, and when to follow up is overwhelming." },
  { title: "Manual attendance", description: "Taking attendance on paper and maintaining records is time-consuming." },
  { title: "Parent communication", description: "Informing parents about fees, attendance, or updates via individual messages takes hours." },
  { title: "No visibility", description: "Can't easily see total revenue, student count, or which batches are most popular." },
];

const tuitionFeatures = [
  { emoji: "👨‍🎓", title: "Student Database", description: "Maintain complete student records with parent contact details and photos." },
  { emoji: "💰", title: "Fee Management", description: "Track monthly fees, pending payments, and payment history automatically." },
  { emoji: "📚", title: "Batch/Course Plans", description: "Create different fee structures for different subjects or batches." },
  { emoji: "📱", title: "WhatsApp Notifications", description: "Send fee reminders and updates to parents instantly via WhatsApp." },
  { emoji: "✅", title: "Attendance Tracking", description: "Quick attendance marking. Parents can see attendance history." },
  { emoji: "📊", title: "Revenue Analytics", description: "Track fee collection, pending dues, and revenue trends monthly." },
];

const tuitionTypes = [
  { emoji: "🔢", name: "Math Tuitions" },
  { emoji: "🔬", name: "Science Classes" },
  { emoji: "🗣️", name: "Language Coaching" },
  { emoji: "🎓", name: "Competitive Exams" },
];

const benefits = [
  { title: "Automated Fee Reminders", description: "No need to manually message parents. System sends WhatsApp reminders automatically for pending fees." },
  { title: "Professional Image", description: "Digital records and systematic fee collection make your center look more organized to parents." },
  { title: "Better Parent Trust", description: "Parents can see complete payment history and attendance anytime, building transparency." },
  { title: "Focus on Teaching", description: "Spend less time on admin work and more time preparing lessons and teaching students." },
];
</script>
