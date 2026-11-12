<template>
  <div class="flex min-h-screen items-start justify-center bg-slate-50 px-4 py-10">
    <div class="w-full max-w-sm">
      <div v-if="error" class="rounded-3xl border border-slate-200 bg-white p-6 text-center">
        <h1 class="text-lg font-semibold text-slate-800">This check-in link doesn't work</h1>
        <p class="mt-2 text-sm text-slate-600">Please check in at the desk.</p>
      </div>

      <div v-else-if="org" class="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div class="bg-primary-600 px-6 py-5 text-white">
          <p class="text-sm opacity-90">Check in at</p>
          <h1 class="text-xl font-bold leading-tight">{{ org.name }}</h1>
        </div>

        <div class="space-y-5 p-6">
          <!-- Done -->
          <div v-if="result" class="space-y-3 text-center">
            <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-100 text-success-700">
              <svg class="h-7 w-7" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <p class="text-xl font-bold text-slate-800">
              {{ result.already ? `You're already in, ${result.firstName}` : `Welcome, ${result.firstName}!` }}
            </p>
            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-2xl bg-primary-50 p-3">
                <p class="text-3xl font-extrabold text-primary-800">{{ result.streak }}</p>
                <p class="text-xs font-medium text-slate-700">{{ result.streak === 1 ? 'day streak' : 'day streak' }}</p>
              </div>
              <div class="rounded-2xl bg-slate-50 p-3">
                <p class="text-3xl font-extrabold text-slate-800">{{ result.visitsThisMonth }}</p>
                <p class="text-xs font-medium text-slate-700">{{ result.visitsThisMonth === 1 ? 'visit' : 'visits' }} this month</p>
              </div>
            </div>
            <p class="text-sm text-slate-600">{{ cheer }}</p>
            <p v-if="result.planExpired" class="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              Your plan has ended. Please renew at the desk.
            </p>
            <p v-else-if="result.planEndsOn" class="text-xs text-slate-600">Plan valid till {{ formatDate(result.planEndsOn) }}</p>
            <button type="button" class="text-xs font-medium text-slate-600 underline" @click="forget">Not you?</button>
          </div>

          <!-- Phone -->
          <form v-else class="space-y-4" @submit.prevent="checkIn()">
            <div>
              <label for="phone" class="mb-1 block text-sm font-medium text-slate-700">Your mobile number</label>
              <input
                id="phone"
                v-model="phone"
                type="tel"
                inputmode="numeric"
                autocomplete="tel"
                placeholder="98765 43210"
                class="block w-full rounded-xl border border-slate-300 px-4 py-3 text-lg text-slate-800 placeholder-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              >
              <p class="mt-1 text-xs text-slate-600">The number you gave when you joined. We'll remember it on this phone.</p>
            </div>
            <p v-if="message" class="rounded-xl bg-red-50 p-3 text-sm text-red-800">{{ message }}</p>
            <button type="submit" :disabled="busy" class="w-full rounded-xl bg-primary-600 px-4 py-3.5 text-base font-semibold text-white hover:bg-primary-700 disabled:opacity-60">
              {{ busy ? 'Checking in…' : 'Check in' }}
            </button>
          </form>
        </div>
      </div>

      <p class="mt-6 text-center text-xs text-slate-600">
        Check-in by <a href="https://memberbook.in" class="font-medium text-slate-700 hover:underline">MemberBook</a>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

interface CheckInResult {
  already: boolean;
  firstName: string;
  streak: number;
  visitsThisMonth: number;
  planEndsOn: string | null;
  planExpired: boolean | null;
}

const token = String(useRoute().params.token);
const { formatDate } = useFormatDate();
const { data: org, error } = await useFetch<{ name: string; type: string }>(`/api/checkin/${token}`);

useHead(() => ({
  title: org.value ? `Check in at ${org.value.name}` : "Check in",
  meta: [{ name: "robots", content: "noindex, nofollow" }],
}));

const storageKey = `mb-checkin-phone-${token}`;
const phone = ref("");
const busy = ref(false);
const message = ref("");
const result = ref<CheckInResult | null>(null);

const cheer = computed(() => {
  const s = result.value?.streak ?? 0;
  if (s >= 10) return "Unstoppable. Keep it going!";
  if (s >= 5) return "Great consistency. Don't break the streak!";
  if (s >= 2) return "Nice, you're building a habit.";
  return "Every visit counts. See you tomorrow!";
});

async function checkIn(auto = false) {
  busy.value = true;
  message.value = "";
  try {
    result.value = await $fetch<CheckInResult>(`/api/checkin/${token}`, { method: "POST", body: { phone: phone.value } });
    try {
      localStorage.setItem(storageKey, phone.value);
    }
    catch {
      // storage blocked; they'll type it next time
    }
  }
  catch (e: unknown) {
    if (!auto) message.value = (e as { data?: { statusMessage?: string } })?.data?.statusMessage || "Couldn't check you in. Please try again.";
  }
  finally {
    busy.value = false;
  }
}

function forget() {
  try {
    localStorage.removeItem(storageKey);
  }
  catch {
    // storage blocked
  }
  phone.value = "";
  result.value = null;
}

// Second visit onwards: one scan and they're in.
onMounted(() => {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved && org.value) {
      phone.value = saved;
      checkIn(true);
    }
  }
  catch {
    // storage blocked
  }
});
</script>
