<template>
  <div class="bg-slate-50">
    <section class="px-4 py-14">
      <div class="mx-auto max-w-5xl">
        <div class="max-w-2xl">
          <p class="text-sm font-semibold uppercase tracking-wide text-primary-600">Contact Us</p>
          <h1 class="mt-3 text-4xl font-bold text-slate-900 sm:text-5xl">Talk to the MemberBook team</h1>
          <p class="mt-4 text-lg text-slate-600">
            Tell us about your gym, library, or tuition center. We will help you set up MemberBook for your workflow.
          </p>
        </div>

        <div class="mt-12 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          <section class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
            <h2 class="text-xl font-semibold text-slate-900">Send us a message</h2>
            <p class="mt-2 text-sm text-slate-600">Response time is typically within one business day.</p>

            <form class="mt-6 space-y-4" @submit.prevent="submitContact">
              <div class="grid gap-4 sm:grid-cols-2">
                <AppInput id="name" v-model="form.name" label="Your Name" placeholder="Aman Sharma" required :error="errors.name" />
                <AppInput
                  id="phone"
                  v-model="form.phone"
                  label="Phone Number"
                  placeholder="+91 98765 43210"
                  required
                  :error="errors.phone"
                />
              </div>

              <AppInput
                id="email"
                v-model="form.email"
                label="Email Address"
                type="email"
                placeholder="you@business.com"
                required
                :error="errors.email"
              />

              <AppInput
                id="business"
                v-model="form.business"
                label="Business Name"
                placeholder="PowerFit Gym"
                required
                :error="errors.business"
              />

              <div>
                <label for="message" class="mb-1 block text-sm font-medium text-slate-700">How can we help?</label>
                <textarea
                  id="message"
                  v-model="form.message"
                  rows="5"
                  required
                  class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 sm:text-sm"
                  placeholder="I want to move from spreadsheets and track memberships and payments in one place."
                />
                <p v-if="errors.message" class="mt-1 text-sm text-danger-600">{{ errors.message }}</p>
              </div>

              <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                <AppButton type="submit" size="lg" :loading="submitting">Send Message</AppButton>
                <p v-if="successMessage" class="text-sm font-medium text-success-700">{{ successMessage }}</p>
                <p v-else-if="submitError" class="text-sm font-medium text-danger-700">{{ submitError }}</p>
              </div>
            </form>
          </section>

          <aside class="space-y-4">
            <div class="rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 p-6 text-white shadow-sm">
              <p class="text-sm font-semibold text-primary-100">Need a faster answer?</p>
              <h3 class="mt-1 text-xl font-semibold">Book a quick product walkthrough</h3>
              <p class="mt-3 text-sm text-primary-100">
                We can show you how to manage plans, payments, and reminders for your specific workflow.
              </p>
              <NuxtLink to="/register" class="mt-5 inline-flex">
                <AppButton size="md" variant="secondary">Start Free & Explore</AppButton>
              </NuxtLink>
            </div>
          </aside>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "default" });

const config = useRuntimeConfig();
const appUrl = config.public.appUrl || "https://memberbook.app";

useSeoMeta({
  title: "Contact Us - MemberBook",
  description: "Contact MemberBook for product demos, setup help, and support. We help gyms, libraries, and tuition centers manage memberships and payments.",
  ogTitle: "Contact MemberBook",
  ogDescription: "Talk to MemberBook for demos, setup help, and support for your membership business.",
  ogImage: `${appUrl}/og-image.png`,
  ogUrl: `${appUrl}/contact`,
  ogType: "website",
  twitterCard: "summary_large_image",
  twitterTitle: "Contact MemberBook",
  twitterDescription: "Reach out to MemberBook for product support and onboarding guidance.",
  twitterImage: `${appUrl}/og-image.png`,
});

useHead({
  link: [
    { rel: "canonical", href: `${appUrl}/contact` },
  ],
});

const form = reactive({
  name: "",
  email: "",
  phone: "",
  business: "",
  message: "",
});

const errors = reactive({
  name: "",
  email: "",
  phone: "",
  business: "",
  message: "",
});

const successMessage = ref("");
const submitError = ref("");
const submitting = ref(false);

function resetErrors() {
  errors.name = "";
  errors.email = "";
  errors.phone = "";
  errors.business = "";
  errors.message = "";
}

function validateForm() {
  resetErrors();
  let hasError = false;

  if (!form.name.trim()) {
    errors.name = "Please enter your name.";
    hasError = true;
  }

  if (!form.phone.trim()) {
    errors.phone = "Please enter your phone number.";
    hasError = true;
  }

  if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) {
    errors.email = "Please enter a valid email address.";
    hasError = true;
  }

  if (!form.business.trim()) {
    errors.business = "Please enter your business name.";
    hasError = true;
  }

  if (!form.message.trim()) {
    errors.message = "Please enter a short message.";
    hasError = true;
  }

  return !hasError;
}

async function submitContact() {
  if (!validateForm()) {
    successMessage.value = "";
    submitError.value = "";
    return;
  }

  submitting.value = true;
  successMessage.value = "";
  submitError.value = "";

  try {
    await $fetch("/api/contact", {
      method: "POST",
      body: {
        name: form.name,
        phone: form.phone,
        email: form.email,
        business: form.business,
        message: form.message,
      },
    });

    successMessage.value = "Thanks, your message has been saved. We will contact you soon.";
    form.name = "";
    form.phone = "";
    form.email = "";
    form.business = "";
    form.message = "";
  } catch (error: unknown) {
    const statusMessage = (error as { data?: { statusMessage?: string } })?.data?.statusMessage;
    submitError.value = statusMessage || "Unable to send your message right now. Please try again.";
  } finally {
    submitting.value = false;
  }
}
</script>
