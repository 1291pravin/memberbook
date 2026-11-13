<template>
  <div
    :class="[
      'rounded-2xl border p-3 sm:p-4 cursor-pointer transition-all hover:shadow-md relative min-w-0',
      hasAlert ? 'border-2 border-red-400' : 'border-slate-200',
      genderBorder,
      'bg-white',
    ]"
    @click="$emit('click', seat)"
  >
    <!-- Warning Icon -->
    <span v-if="hasAlert" class="absolute top-2 right-2 text-sm" title="Needs attention">&#x26A0;&#xFE0F;</span>

    <!-- Seat Number (Large) -->
    <div class="text-xl font-bold mb-1 text-slate-800">
      {{ seat.seatNumber }}
    </div>

    <!-- Seat Label (if present) -->
    <div v-if="seat.seatLabel && seat.seatLabel !== `Seat ${seat.seatNumber.replace(/^S/i, '')}`" class="text-xs text-slate-600 mb-2 truncate">
      {{ seat.seatLabel }}
    </div>

    <!-- Preferences -->
    <div v-if="timeLabel || genderLabel" class="flex flex-wrap gap-1 mb-2">
      <span v-if="timeLabel" class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">{{ timeLabel }}</span>
      <span v-if="genderLabel" class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">{{ genderLabel }}</span>
    </div>

    <!-- Occupancy Status -->
    <div v-if="seat.isOccupied && seat.currentOccupant" class="border-t border-slate-200 pt-2">
      <span class="inline-block px-1.5 py-0.5 text-[10px] font-semibold uppercase rounded bg-green-600 text-white mb-1">Checked In</span>
      <div class="font-medium text-sm mb-1 text-slate-800 truncate">
        {{ seat.currentOccupant.memberName }}
      </div>
      <div v-if="alertLabel" class="text-xs font-medium mb-1" :class="alertLabel === 'No subscription' ? 'text-red-600' : 'text-amber-600'">
        {{ alertLabel }}
      </div>
      <div class="text-xs text-slate-600">
        {{ formatCheckInTime(seat.currentOccupant.checkedInAt) }}
      </div>
    </div>
    <div v-else-if="assignedMember" class="border-t border-slate-200 pt-2">
      <span class="inline-block px-1.5 py-0.5 text-[10px] font-semibold uppercase rounded bg-slate-200 text-slate-700 mb-1">Assigned</span>
      <div class="font-medium text-sm mb-1 text-slate-800 truncate">
        {{ assignedMember.memberName }}
      </div>
      <div v-if="alertLabel" class="text-xs font-medium mb-1" :class="alertLabel === 'No subscription' ? 'text-red-600' : 'text-amber-600'">
        {{ alertLabel }}
      </div>
    </div>
    <div v-else class="border-t border-slate-200 pt-2">
      <div class="text-sm text-slate-600 font-medium">
        Vacant
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const TIME_LABELS: Record<string, string> = { "day": "Day", "evening": "Evening", "flexible": "Flexible", "all-day": "All day" };
const GENDER_LABELS: Record<string, string> = { male: "Male only", female: "Female only" };
interface Seat {
  id: number;
  seatNumber: string;
  seatLabel?: string | null;
  timePreference?: string | null;
  genderPreference?: string | null;
  isOccupied: boolean;
  currentOccupant?: {
    checkInId: number;
    memberId: number;
    memberName: string;
    memberGender?: string | null;
    checkedInAt: string;
  } | null;
}

interface MemberAlert {
  hasActiveSubscription: boolean;
  paymentStatus: string | null;
}

interface AssignedMember {
  memberId: number;
  memberName: string;
  memberGender?: string | null;
}

const props = defineProps<{
  seat: Seat;
  assignedMember?: AssignedMember | null;
  memberAlert?: MemberAlert | null;
}>();

defineEmits<{
  click: [seat: Seat];
}>();

const hasAlert = computed(() => {
  if (!props.memberAlert) return false;
  return !props.memberAlert.hasActiveSubscription || props.memberAlert.paymentStatus === 'unpaid' || props.memberAlert.paymentStatus === 'partial';
});

const alertLabel = computed(() => {
  if (!props.memberAlert) return null;
  if (!props.memberAlert.hasActiveSubscription) return 'No subscription';
  if (props.memberAlert.paymentStatus === 'unpaid') return 'Unpaid';
  if (props.memberAlert.paymentStatus === 'partial') return 'Partial payment';
  return null;
});

const timeLabel = computed(() => (props.seat.timePreference ? TIME_LABELS[props.seat.timePreference] : undefined));
const genderLabel = computed(() => (props.seat.genderPreference ? GENDER_LABELS[props.seat.genderPreference] : undefined));

const genderBorder = computed(() => {
  const gender = props.seat.isOccupied
    ? props.seat.currentOccupant?.memberGender
    : props.assignedMember?.memberGender;

  if (gender === 'female') return 'border-l-4 border-l-pink-400';
  if (gender === 'male') return 'border-l-4 border-l-blue-400';
  return '';
});

function formatCheckInTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
</script>
