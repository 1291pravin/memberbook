<template>
  <div
    :class="[
      'rounded-xl border p-4 shadow-sm cursor-pointer transition-all hover:shadow-md',
      bgColor,
    ]"
    @click="$emit('click', seat)"
  >
    <!-- Seat Number (Large) -->
    <div class="text-2xl font-bold mb-2" :class="textColor">
      {{ seat.seatNumber }}
    </div>

    <!-- Seat Label (if present) -->
    <div v-if="seat.seatLabel" class="text-xs text-slate-600 mb-2">
      {{ seat.seatLabel }}
    </div>

    <!-- Preferences Icons -->
    <div class="flex gap-2 mb-3">
      <span v-if="seat.timePreference === 'day'" class="text-lg" title="Day">☀️</span>
      <span v-else-if="seat.timePreference === 'evening'" class="text-lg" title="Evening">🌙</span>
      <span v-else-if="seat.timePreference === 'flexible'" class="text-lg" title="Flexible">🔄</span>
      <span v-else-if="seat.timePreference === 'all-day'" class="text-lg" title="All Day">🕐</span>

      <span v-if="seat.genderPreference === 'male'" class="text-sm" title="Male preferred">♂️</span>
      <span v-else-if="seat.genderPreference === 'female'" class="text-sm" title="Female preferred">♀️</span>
    </div>

    <!-- Occupancy Status -->
    <div v-if="seat.isOccupied && seat.currentOccupant" class="border-t border-slate-200 pt-2">
      <div class="font-medium text-sm mb-1" :class="textColor">
        {{ seat.currentOccupant.memberName }}
      </div>
      <div class="text-xs text-slate-600">
        {{ formatCheckInTime(seat.currentOccupant.checkedInAt) }}
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

const props = defineProps<{
  seat: Seat;
}>();

defineEmits<{
  click: [seat: Seat];
}>();

const bgColor = computed(() => {
  if (!props.seat.isOccupied) {
    return 'bg-white border-slate-200';
  }
  const gender = props.seat.currentOccupant?.memberGender;
  if (gender === 'female') {
    return 'bg-pink-100 border-pink-300';
  }
  if (gender === 'male') {
    return 'bg-yellow-100 border-yellow-300';
  }
  return 'bg-cyan-100 border-cyan-300';
});

const textColor = computed(() => {
  if (!props.seat.isOccupied) {
    return 'text-slate-700';
  }
  const gender = props.seat.currentOccupant?.memberGender;
  if (gender === 'female') {
    return 'text-pink-900';
  }
  if (gender === 'male') {
    return 'text-yellow-900';
  }
  return 'text-cyan-900';
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
