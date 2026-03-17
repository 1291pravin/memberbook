<template>
  <div class="relative" :style="{ height: height + 'px' }">
    <Line v-if="hasData" :data="chartData" :options="chartOptions" />
    <div v-else class="flex items-center justify-center h-full text-slate-600 text-sm">
      {{ emptyMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChartData, ChartOptions } from "chart.js";
import { Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const props = defineProps<{
  chartData: ChartData<"line">;
  chartOptions?: ChartOptions<"line">;
  height?: number;
  emptyMessage?: string;
}>();

const height = computed(() => props.height || 250);
const hasData = computed(() => {
  const ds = props.chartData.datasets;
  if (ds.length === 0) return false;
  return ds.some(d => (d.data as number[]).some(v => v !== 0));
});
</script>
