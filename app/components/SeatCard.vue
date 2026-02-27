<template>
  <div
    :class="[
      'rounded-xl border p-4 shadow-sm cursor-pointer transition-all hover:shadow-md relative',
      hasAlert ? 'border-2 border-red-400' : 'border-slate-200',
      genderBorder,
      'bg-white',
    ]"
    @click="$emit('click', seat)"
  >
    <!-- Warning Icon -->
    <span v-if="hasAlert" class="absolute top-2 right-2 text-sm" title="Needs attention">&#x26A0;&#xFE0F;</span>

    <!-- Seat Number (Large) -->
    <div class="text-2xl font-bold mb-2 text-slate-800">
      {{ seat.seatNumber }}
    </div>

    <!-- Seat Label (if present) -->
    <div v-if="seat.seatLabel" class="text-xs text-slate-600 mb-2">
      {{ seat.seatLabel }}
    </div>

    <!-- Preferences Icons -->
    <div class="flex gap-2 mb-3">
      <span v-if="seat.timePreference === 'day'" class="text-lg" title="Day">&#x2600;&#xFE0F;</span>
      <span v-else-if="seat.timePreference === 'evening'" class="text-lg" title="Evening">&#x1F319;</span>
      <span v-else-if="seat.timePreference === 'flexible'" class="text-lg" title="Flexible">&#x1F504;</span>
      <span v-else-if="seat.timePreference === 'all-day'" class="text-lg" title="All Day">&#x1F550;</span>

      <span v-if="seat.genderPreference === 'male'" class="text-sm" title="Male preferred">&#x2642;&#xFE0F;</span>
      <span v-else-if="seat.genderPreference === 'female'" class="text-sm" title="Female preferred">&#x2640;&#xFE0F;</span>
    </div>

    <!-- Occupancy Status -->
    <div v-if="seat.isOccupied && seat.currentOccupant" class="border-t border-slate-200 pt-2">
      <span class="inline-block px-1.5 py-0.5 text-[10px] font-semibold uppercase rounded bg-green-600 text-white mb-1">Checked In</span>
      <div class="font-medium text-sm mb-1 text-slate-800">
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
      <span class="inline-block px-1.5 py-0.5 text-[10px] font-semibold uppercase rounded bg-slate-200 text-slate-600 mb-1">Assigned</span>
      <div class="font-medium text-sm mb-1 text-slate-800">
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
