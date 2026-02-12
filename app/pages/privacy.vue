<template>
  <div class="min-h-screen bg-slate-50">
    <div class="max-w-4xl mx-auto px-4 py-12">
      <!-- Header -->
      <div class="mb-8">
        <NuxtLink to="/" class="text-primary-600 hover:text-primary-700 text-sm font-medium">
          ← Back to Home
        </NuxtLink>
        <h1 class="mt-4 text-3xl font-bold text-slate-800">Privacy Policy</h1>
        <p class="mt-2 text-slate-500">Last updated: {{ lastUpdated }}</p>
      </div>

      <!-- Content -->
      <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-8 space-y-6">
        <section>
          <h2 class="text-xl font-semibold text-slate-800 mb-3">1. Introduction</h2>
          <p class="text-slate-600 leading-relaxed">
            MemberBook ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our membership management service.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-slate-800 mb-3">2. Information We Collect</h2>
          <div class="space-y-3">
            <div>
              <h3 class="font-medium text-slate-700 mb-2">2.1 Information You Provide</h3>
              <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
                <li>Account information (name, email address, password)</li>
                <li>Organization details (business name, contact information)</li>
                <li>Member information you enter into the system</li>
                <li>Payment records and subscription data</li>
              </ul>
            </div>
            <div>
              <h3 class="font-medium text-slate-700 mb-2">2.2 Automatically Collected Information</h3>
              <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
                <li>Usage data (features accessed, time spent)</li>
                <li>Device information (browser type, operating system)</li>
                <li>IP address and location data</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-slate-800 mb-3">3. How We Use Your Information</h2>
          <p class="text-slate-600 leading-relaxed mb-2">We use the collected information to:</p>
          <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
            <li>Provide, operate, and maintain our service</li>
            <li>Process your transactions and manage subscriptions</li>
            <li>Send you notifications, updates, and support messages</li>
            <li>Improve and personalize your experience</li>
            <li>Analyze usage patterns and optimize our service</li>
            <li>Detect, prevent, and address technical issues or fraud</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-slate-800 mb-3">4. Data Sharing and Disclosure</h2>
          <p class="text-slate-600 leading-relaxed mb-2">We do not sell your personal information. We may share your information with:</p>
          <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
            <li><strong>Service Providers:</strong> Third-party vendors who help us operate our service (hosting, analytics, payment processing)</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            <li><strong>With Your Consent:</strong> When you explicitly authorize us to share your information</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-slate-800 mb-3">5. Data Security</h2>
          <p class="text-slate-600 leading-relaxed">
            We implement appropriate technical and organizational measures to protect your information against unauthorized access, alteration, disclosure, or destruction. However, no internet transmission is completely secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-slate-800 mb-3">6. Data Retention</h2>
          <p class="text-slate-600 leading-relaxed">
            We retain your information for as long as necessary to provide our services and comply with legal obligations. When you delete your account, we will delete or anonymize your personal information within a reasonable timeframe, except where we are required to retain it by law.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-slate-800 mb-3">7. Your Rights</h2>
          <p class="text-slate-600 leading-relaxed mb-2">You have the right to:</p>
          <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
            <li>Access, update, or delete your personal information</li>
            <li>Object to processing of your information</li>
            <li>Request data portability</li>
            <li>Withdraw consent (where applicable)</li>
            <li>Lodge a complaint with a data protection authority</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-slate-800 mb-3">8. Third-Party Services</h2>
          <p class="text-slate-600 leading-relaxed">
            Our service may integrate with third-party services (such as Google OAuth for authentication and WhatsApp for messaging). These services have their own privacy policies, and we encourage you to review them.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-slate-800 mb-3">9. Children's Privacy</h2>
          <p class="text-slate-600 leading-relaxed">
            Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, please contact us immediately.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-slate-800 mb-3">10. International Data Transfers</h2>
          <p class="text-slate-600 leading-relaxed">
            Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-slate-800 mb-3">11. Changes to This Privacy Policy</h2>
          <p class="text-slate-600 leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. Your continued use of the service after changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-slate-800 mb-3">12. Contact Us</h2>
          <p class="text-slate-600 leading-relaxed">
            If you have questions or concerns about this Privacy Policy, please contact us at:
          </p>
          <div class="mt-3 text-slate-600">
            <p><strong>Email:</strong> privacy@memberbook.in</p>
            <p><strong>Website:</strong> <a href="http://memberbook.in" class="text-primary-600 hover:underline">http://memberbook.in</a></p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "default" });

const config = useRuntimeConfig();
const appUrl = config.public.appUrl || "https://memberbook.app";
const lastUpdated = "February 8, 2026";

useSeoMeta({
  title: "Privacy Policy - MemberBook",
  description: "Privacy Policy for MemberBook membership management service. Learn how we collect, use, and protect your data.",
  robots: "index, follow",
});

useHead({
  link: [
    { rel: "canonical", href: `${appUrl}/privacy` },
  ],
});
</script>
