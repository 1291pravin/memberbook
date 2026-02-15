<template>
  <div class="relative" :style="{ height: height + 'px' }">
    <Bar v-if="chartData.datasets.length > 0" :data="chartData" :options="chartOptions" />
    <div v-else class="flex items-center justify-center h-full text-slate-600 text-sm">
      {{ emptyMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChartData, ChartOptions } from "chart.js";
import { Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const props = defineProps<{
  chartData: ChartData<"bar">;
  chartOptions?: ChartOptions<"bar">;
  height?: number;
  emptyMessage?: string;
}>();

const height = computed(() => props.height || 250);
</script>
