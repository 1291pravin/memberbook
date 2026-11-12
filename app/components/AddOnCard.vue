<template>
  <div
    class="flex flex-col rounded-3xl border bg-white p-5"
    :class="addOn.status === 'active' ? 'border-primary-300 ring-1 ring-primary-200' : 'border-slate-200'"
  >
    <div class="flex items-start justify-between gap-3">
      <h3 class="text-lg font-bold leading-snug text-slate-800">{{ addOn.name }}</h3>
      <AppBadge v-if="addOn.status === 'active'" color="green">On</AppBadge>
      <AppBadge v-else-if="addOn.status === 'notify'" color="blue">We'll tell you</AppBadge>
    </div>
    <p class="mt-1 text-sm text-slate-600">{{ addOn.tagline }}</p>

    <ul class="mt-3 space-y-1.5 text-sm text-slate-700">
      <li v-for="p in addOn.points" :key="p" class="flex gap-2">
        <svg class="mt-0.5 h-4 w-4 shrink-0 text-primary-600" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
        {{ p }}
      </li>
    </ul>

    <div class="mt-auto pt-4">
      <p class="text-sm text-slate-800">
        <template v-if="addOn.price > 0">
          <span class="text-xl font-bold">{{ formatCurrency(addOn.price) }}</span><span class="text-slate-600"> a month</span>
          <span v-if="addOn.status === 'active' && addOn.trialEndsOn" class="block text-xs text-slate-600">
            {{ trialText }}
          </span>
          <span v-else-if="addOn.available" class="block text-xs text-slate-600">First month free</span>
        </template>
        <span v-else-if="addOn.available" class="text-xl font-bold">Free</span>
        <span v-else class="text-sm text-slate-600">Price to be decided</span>
      </p>

      <div class="mt-3 flex flex-wrap gap-2">
        <template v-if="addOn.status === 'active'">
          <AppButton v-if="addOn.page" size="sm" @click="navigateTo(addOn.page)">Open</AppButton>
          <AppButton v-if="isOwner" size="sm" variant="ghost" :loading="busy" @click="confirmStop">Switch off</AppButton>
        </template>
        <template v-else-if="addOn.available">
          <AppButton v-if="isOwner" size="sm" :loading="busy" @click="$emit('start')">
            {{ addOn.price > 0 ? 'Start free month' : 'Switch on' }}
          </AppButton>
          <p v-else class="text-xs text-slate-600">Ask the owner to switch this on.</p>
        </template>
        <template v-else>
          <AppButton v-if="addOn.status !== 'notify' && isOwner" size="sm" variant="secondary" :loading="busy" @click="$emit('notify')">
            Tell me when it's ready
          </AppButton>
          <p v-else-if="addOn.status === 'notify'" class="text-xs text-slate-600">We'll message you when it's ready.</p>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  addOn: {
    key: string;
    name: string;
    tagline: string;
    points: string[];
    price: number;
    page: string | null;
    available: boolean;
    status: "off" | "active" | "notify";
    trialEndsOn: string | null;
  };
  isOwner: boolean;
  busy?: boolean;
}>();
const emit = defineEmits<{ start: []; stop: []; notify: [] }>();
const { formatCurrency } = useFormatCurrency();

const trialText = computed(() => {
  const end = props.addOn.trialEndsOn;
  if (!end) return "";
  const label = new Date(`${end}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return end >= new Date().toISOString().slice(0, 10) ? `Free until ${label}` : `Free month ended ${label}`;
});

function confirmStop() {
  // Plain confirm keeps an accidental tap from switching off a live website.
  if (window.confirm(`Switch off "${props.addOn.name}"?`)) emit("stop");
}
</script>
