<template>
  <div class="relative" :style="{ height: height + 'px' }">
    <Doughnut v-if="hasData" :data="chartData" :options="chartOptions" />
    <div v-else class="flex items-center justify-center h-full text-slate-600 text-sm">
      {{ emptyMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChartData, ChartOptions } from "chart.js";
import { Doughnut } from "vue-chartjs";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const props = defineProps<{
  chartData: ChartData<"doughnut">;
  chartOptions?: ChartOptions<"doughnut">;
  height?: number;
  emptyMessage?: string;
}>();

const height = computed(() => props.height || 250);
const hasData = computed(() => {
  const ds = props.chartData.datasets;
  return ds.length > 0 && (ds[0]?.data?.length ?? 0) > 0;
});
</script>
