<template>
  <div class="min-h-screen bg-slate-50">
    <div class="max-w-4xl mx-auto px-4 py-12">
      <!-- Header -->
      <div class="mb-8">
        <NuxtLink to="/" class="text-primary-600 hover:text-primary-700 text-sm font-medium">
          ← Back to Home
        </NuxtLink>
        <h1 class="mt-4 text-3xl font-bold text-slate-800">Terms of Service</h1>
        <p class="mt-2 text-slate-500">Last updated: {{ lastUpdated }}</p>
      </div>

      <!-- Content -->
      <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-8 space-y-6">
        <section>
          <h2 class="text-xl font-semibold text-slate-800 mb-3">1. Acceptance of Terms</h2>
          <p class="text-slate-600 leading-relaxed">
            By accessing or using MemberBook ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Service.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-slate-800 mb-3">2. Description of Service</h2>
          <p class="text-slate-600 leading-relaxed">
            MemberBook is a membership and subscription management platform designed for small businesses such as gyms, libraries, and tuition centers. The Service allows you to manage members, track subscriptions, record payments, and communicate with members.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-slate-800 mb-3">3. User Accounts</h2>
          <div class="space-y-3 text-slate-600">
            <p><strong>3.1 Account Creation:</strong> You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials.</p>
            <p><strong>3.2 Account Security:</strong> You are responsible for all activities that occur under your account. Notify us immediately of any unauthorized use.</p>
            <p><strong>3.3 Eligibility:</strong> You must be at least 18 years old to use the Service. By using the Service, you represent that you meet this requirement.</p>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-slate-800 mb-3">4. Acceptable Use</h2>
          <p class="text-slate-600 leading-relaxed mb-2">You agree not to:</p>
          <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe on intellectual property rights of others</li>
            <li>Upload malicious code, viruses, or harmful content</li>
            <li>Attempt to gain unauthorized access to the Service</li>
            <li>Interfere with or disrupt the Service or servers</li>
            <li>Use the Service for fraudulent or illegal purposes</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Scrape, crawl, or use automated tools without permission</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-slate-800 mb-3">5. Data and Content</h2>
          <div class="space-y-3 text-slate-600">
            <p><strong>5.1 Your Data:</strong> You retain ownership of all data you enter into the Service. You grant us a license to use, store, and process this data solely to provide the Service.</p>
            <p><strong>5.2 Data Responsibility:</strong> You are responsible for the accuracy and legality of the data you enter. You must have appropriate rights to enter member information.</p>
            <p><strong>5.3 Backup:</strong> While we implement backup procedures, you are responsible for maintaining your own backups of critical data.</p>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-slate-800 mb-3">6. Fees and Payment</h2>
          <div class="space-y-3 text-slate-600">
            <p><strong>6.1 Pricing:</strong> Pricing information is available on our website. We reserve the right to change our fees with reasonable notice.</p>
            <p><strong>6.2 Payment Terms:</strong> Fees are payable in advance. Failure to pay may result in suspension or termination of your account.</p>
            <p><strong>6.3 Refunds:</strong> Refunds are provided at our discretion and in accordance with our refund policy.</p>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-slate-800 mb-3">7. Intellectual Property</h2>
          <p class="text-slate-600 leading-relaxed">
            The Service, including its design, code, features, and content, is owned by MemberBook and protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works without our express permission.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-slate-800 mb-3">8. Third-Party Services</h2>
          <p class="text-slate-600 leading-relaxed">
            The Service may integrate with third-party services (such as Google OAuth and WhatsApp). Your use of these services is governed by their respective terms and policies. We are not responsible for third-party services.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-slate-800 mb-3">9. Service Availability</h2>
          <p class="text-slate-600 leading-relaxed">
            We strive to maintain high availability but do not guarantee uninterrupted access. The Service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-slate-800 mb-3">10. Limitation of Liability</h2>
          <p class="text-slate-600 leading-relaxed">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, MEMBERBOOK SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-slate-800 mb-3">11. Disclaimer of Warranties</h2>
          <p class="text-slate-600 leading-relaxed">
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-slate-800 mb-3">12. Indemnification</h2>
          <p class="text-slate-600 leading-relaxed">
            You agree to indemnify and hold harmless MemberBook from any claims, damages, losses, liabilities, and expenses arising from your use of the Service, violation of these Terms, or infringement of any rights of another party.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-slate-800 mb-3">13. Termination</h2>
          <div class="space-y-3 text-slate-600">
            <p><strong>13.1 By You:</strong> You may terminate your account at any time through the Service settings.</p>
            <p><strong>13.2 By Us:</strong> We may suspend or terminate your account if you violate these Terms, engage in fraudulent activity, or for any other reason at our discretion.</p>
            <p><strong>13.3 Effect of Termination:</strong> Upon termination, your right to use the Service ceases. We may delete your data after a reasonable period.</p>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-slate-800 mb-3">14. Modifications to Terms</h2>
          <p class="text-slate-600 leading-relaxed">
            We reserve the right to modify these Terms at any time. We will notify you of material changes via email or through the Service. Your continued use after changes constitutes acceptance of the modified Terms.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-slate-800 mb-3">15. Governing Law</h2>
          <p class="text-slate-600 leading-relaxed">
            These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-slate-800 mb-3">16. Dispute Resolution</h2>
          <p class="text-slate-600 leading-relaxed">
            Any disputes arising from these Terms or the Service shall be resolved through binding arbitration in accordance with the rules of the Indian Arbitration and Conciliation Act, 1996.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-slate-800 mb-3">17. Severability</h2>
          <p class="text-slate-600 leading-relaxed">
            If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-slate-800 mb-3">18. Contact Information</h2>
          <p class="text-slate-600 leading-relaxed">
            For questions about these Terms, please contact us at:
          </p>
          <div class="mt-3 text-slate-600">
            <p><strong>Email:</strong> support@memberbook.in</p>
            <p><strong>Website:</strong> <a href="http://memberbook.in" class="text-primary-600 hover:underline">http://memberbook.in</a></p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "default" });

const lastUpdated = "February 8, 2026";

useSeoMeta({
  title: "Terms of Service - MemberBook",
  description: "Terms of Service for MemberBook membership management service",
});
</script>
