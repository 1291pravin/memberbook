<template>
  <div>
    <!-- Hero -->
    <section class="py-16 px-4 text-center">
      <div class="max-w-3xl mx-auto">
        <h1 class="text-4xl font-bold text-gray-900 sm:text-5xl">
          Manage your members,
          <span class="text-indigo-600">effortlessly</span>
        </h1>
        <p class="mt-4 text-lg text-gray-600 max-w-xl mx-auto">
          Simple subscription and member management for gyms, libraries, tuition centers, and more. No spreadsheets. No WhatsApp chaos.
        </p>
        <div class="mt-8 flex gap-3 justify-center">
          <NuxtLink to="/register">
            <AppButton size="lg">Start Free</AppButton>
          </NuxtLink>
          <NuxtLink to="/login">
            <AppButton size="lg" variant="secondary">Sign In</AppButton>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="py-16 px-4 bg-white">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-2xl font-bold text-center text-gray-900 mb-12">Everything you need</h2>
        <div class="grid md:grid-cols-3 gap-8">
          <div v-for="feature in features" :key="feature.title" class="text-center">
            <div class="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span class="text-indigo-600 text-xl">{{ feature.emoji }}</span>
            </div>
            <h3 class="font-semibold text-gray-900">{{ feature.title }}</h3>
            <p class="text-sm text-gray-500 mt-2">{{ feature.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-16 px-4 text-center">
      <div class="max-w-xl mx-auto">
        <h2 class="text-2xl font-bold text-gray-900">Ready to get organized?</h2>
        <p class="mt-2 text-gray-600">Set up your workspace in under a minute.</p>
        <NuxtLink to="/register" class="mt-6 inline-block">
          <AppButton size="lg">Create Your Account</AppButton>
        </NuxtLink>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-gray-200 py-8 text-center text-sm text-gray-500">
      MemberBook &mdash; Simple member management for small businesses.
    </footer>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "default" });

const features = [
  { emoji: "👥", title: "Member Management", desc: "Track members, their subscriptions, and payment history in one place." },
  { emoji: "📋", title: "Flexible Plans", desc: "Create custom subscription plans with any duration and price." },
  { emoji: "💰", title: "Payment Tracking", desc: "Record payments manually. Send WhatsApp reminders for pending dues." },
  { emoji: "📊", title: "Dashboard", desc: "See active members, revenue, and expiring subscriptions at a glance." },
  { emoji: "🔔", title: "Smart Reminders", desc: "Pre-filled WhatsApp messages for payment and renewal reminders." },
  { emoji: "👥", title: "Multi-Staff", desc: "Add staff members to help manage your business." },
];
</script>
