<template>
  <div>
    <!-- Step 1: Paste or upload -->
    <div v-if="step === 'input'" class="space-y-4">
      <div class="flex rounded-lg bg-slate-100 p-1 text-sm font-medium" role="tablist">
        <button
          type="button"
          role="tab"
          :aria-selected="mode === 'paste'"
          class="flex-1 rounded-md px-3 py-1.5 transition-colors"
          :class="mode === 'paste' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'"
          @click="mode = 'paste'"
        >
          Paste a list
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="mode === 'file'"
          class="flex-1 rounded-md px-3 py-1.5 transition-colors"
          :class="mode === 'file' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'"
          @click="mode = 'file'"
        >
          Upload a file
        </button>
      </div>

      <div v-if="mode === 'paste'">
        <label for="member-import-paste" class="mb-1 block text-sm font-medium text-slate-700">
          Copy your {{ t.membersLower }} from Excel, Google Sheets or WhatsApp and paste them here
        </label>
        <textarea
          id="member-import-paste"
          v-model="pasted"
          rows="8"
          class="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-800 placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          :placeholder="pastePlaceholder"
        />
        <p class="mt-1 text-xs text-slate-600">
          In Excel or Sheets, select the rows (with the heading row if you have one), press Ctrl+C, then paste here.
          A plain list with one {{ t.memberLower }} per line works too.
        </p>
        <div class="mt-3 flex justify-end">
          <AppButton :disabled="!pasted.trim()" @click="preview(pasted)">Check {{ t.membersLower }}</AppButton>
        </div>
      </div>

      <div v-else>
        <div
          class="cursor-pointer rounded-lg border-2 border-dashed border-slate-300 p-8 text-center transition-colors hover:border-primary-400"
          :class="{ 'border-primary-400 bg-primary-50': dragOver }"
          @click="fileInput?.click()"
          @dragover.prevent="dragOver = true"
          @dragleave="dragOver = false"
          @drop.prevent="handleDrop"
        >
          <p class="text-sm text-slate-700">Click or drag a CSV file here</p>
          <p class="mt-1 text-xs text-slate-600">Any column names are fine. Only a name is needed.</p>
          <input
            ref="fileInput"
            type="file"
            accept=".csv,.tsv,.txt,text/csv,text/plain,.xlsx,.xls"
            class="hidden"
            @change="handleFileSelect"
          >
        </div>
        <p v-if="fileError" class="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{{ fileError }}</p>
        <button type="button" class="mt-3 text-sm text-primary-700 hover:underline" @click="downloadTemplate">
          Download a blank template
        </button>
      </div>

      <div v-if="supportLink" class="rounded-lg border border-green-200 bg-green-50 p-3">
        <p class="text-sm font-medium text-green-900">Only have a paper register?</p>
        <p class="mt-0.5 text-sm text-green-800">
          Send us photos of it on WhatsApp and we'll add your {{ t.membersLower }} for you, free.
        </p>
        <a
          :href="supportLink"
          target="_blank"
          rel="noopener"
          class="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-green-800 underline"
        >
          Send register photos on WhatsApp
        </a>
      </div>
    </div>

    <!-- Step 2: Preview -->
    <div v-else-if="step === 'preview'" class="space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="text-sm text-slate-700">
          <span class="font-semibold text-green-700">{{ readyRows.length }} ready</span>
          <span v-if="warningCount" class="ml-2 text-amber-700">{{ warningCount }} with notes</span>
          <span v-if="errorRows.length" class="ml-2 font-medium text-red-700">{{ errorRows.length }} skipped</span>
        </p>
        <button type="button" class="text-sm text-slate-600 hover:underline" @click="reset">Change list</button>
      </div>

      <p v-if="columnSummary" class="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
        {{ columnSummary }}
      </p>

      <div class="max-h-72 overflow-auto rounded-lg border border-slate-200">
        <table class="w-full text-xs">
          <thead class="sticky top-0 bg-slate-50">
            <tr>
              <th class="px-2 py-1.5 text-left font-semibold text-slate-700">Name</th>
              <th class="px-2 py-1.5 text-left font-semibold text-slate-700">Phone</th>
              <th class="px-2 py-1.5 text-left font-semibold text-slate-700">Plan</th>
              <th class="px-2 py-1.5 text-left font-semibold text-slate-700">Check</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="row in parsed.rows" :key="row.line" :class="row.error ? 'bg-red-50' : row.warnings.length ? 'bg-amber-50' : ''">
              <td class="px-2 py-1.5 text-slate-800">{{ row.member.name || '—' }}</td>
              <td class="px-2 py-1.5 text-slate-600">{{ row.member.phone || '—' }}</td>
              <td class="px-2 py-1.5 text-slate-600">
                <template v-if="row.member.plan">{{ row.member.plan }}<br><span class="text-slate-500">from {{ row.member.startDate }}</span></template>
                <template v-else>—</template>
              </td>
              <td class="px-2 py-1.5">
                <span v-if="row.error" class="text-red-700">{{ row.error }} (line {{ row.line }})</span>
                <span v-else-if="row.warnings.length" class="text-amber-800">{{ row.warnings.join('. ') }}</span>
                <span v-else class="text-green-700">OK</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="missingPlans.length" class="text-xs text-slate-600">
        Tip: create the plan{{ missingPlans.length > 1 ? 's' : '' }} {{ missingPlans.map(p => `"${p}"`).join(', ') }}
        first and check again to set each {{ t.memberLower }}'s plan and due date too.
      </p>

      <div class="flex justify-end gap-2">
        <AppButton v-if="cancellable" variant="secondary" @click="$emit('cancel')">Cancel</AppButton>
        <AppButton :disabled="readyRows.length === 0" :loading="importing" @click="doImport">
          Import {{ readyRows.length }} {{ readyRows.length === 1 ? t.memberLower : t.membersLower }}
        </AppButton>
      </div>
    </div>

    <!-- Step 3: Results -->
    <div v-else-if="step === 'results'" class="space-y-3">
      <div class="rounded-lg p-4" :class="importedCount ? 'bg-green-50' : 'bg-red-50'">
        <p class="text-base font-semibold" :class="importedCount ? 'text-green-800' : 'text-red-800'">
          {{ importedCount ? `${importedCount} ${importedCount === 1 ? t.memberLower : t.membersLower} added` : 'Nothing was imported' }}
        </p>
        <p v-if="failedCount" class="mt-0.5 text-sm text-red-700">{{ failedCount }} could not be added:</p>
      </div>
      <div v-if="importErrors.length" class="max-h-40 space-y-1 overflow-auto text-xs">
        <p v-for="(err, i) in importErrors" :key="i" class="text-red-700">{{ err }}</p>
      </div>
      <div class="flex justify-end gap-2">
        <AppButton variant="secondary" @click="reset">Import more</AppButton>
        <AppButton @click="$emit('done', importedCount)">Done</AppButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  parseMemberImport,
  IMPORT_TEMPLATE_HEADERS,
  type ParsedImport,
  type ImportField,
} from "~~/shared/utils/member-import";

withDefaults(defineProps<{ cancellable?: boolean }>(), { cancellable: true });

const emit = defineEmits<{
  cancel: [];
  /** Fired once rows were sent, with how many were added. */
  imported: [count: number];
  done: [count: number];
}>();

const { orgId, currentOrg } = useOrg();
const t = useTerminology();
const { api } = useApi();
const { whatsappLink } = useSupport();

const step = ref<"input" | "preview" | "results">("input");
const mode = ref<"paste" | "file">("paste");
const pasted = ref("");
const fileInput = ref<HTMLInputElement | null>(null);
const dragOver = ref(false);
const fileError = ref("");
const importing = ref(false);
const parsed = ref<ParsedImport>({ rows: [], columns: {}, hasHeader: false });
const missingPlans = ref<string[]>([]);

const importedCount = ref(0);
const failedCount = ref(0);
const importErrors = ref<string[]>([]);

const pastePlaceholder = `Name\tPhone\tPlan\tStart date\nAmit Sharma\t98765 43210\tMonthly\t05/01/2025

or simply:
Amit Sharma 98765 43210
Priya Kumar 87654 32109`;

const supportLink = computed(() => whatsappLink(
  `Hi MemberBook team, please help me add my ${t.value.membersLower} to ${currentOrg.value?.name ?? "my workspace"}. I'll send photos of my register here.`,
));

const readyRows = computed(() => parsed.value.rows.filter(r => !r.error));
const errorRows = computed(() => parsed.value.rows.filter(r => r.error));
const warningCount = computed(() => readyRows.value.filter(r => r.warnings.length).length);

const FIELD_LABELS: Record<ImportField, string> = {
  name: "name", phone: "phone", email: "email", status: "status", notes: "notes",
  fatherName: "father's name", address: "address", batch: "batch", plan: "plan",
  startDate: "start date", amountPaid: "amount paid", paymentMethod: "payment method",
};

const columnSummary = computed(() => {
  const entries = Object.entries(parsed.value.columns) as [ImportField, string][];
  if (!entries.length) return "";
  const parts = entries.map(([field, col]) => `${FIELD_LABELS[field]} from "${col}"`);
  return `We read ${parts.join(", ")}. Other columns are saved in notes.`;
});

async function loadPlans() {
  try {
    const res = await api<{ plans: { name: string; price: number }[] }>(`/api/orgs/${orgId.value}/plans`);
    return res.plans;
  }
  catch {
    return [];
  }
}

async function preview(text: string) {
  const plans = await loadPlans();
  parsed.value = parseMemberImport(text, {
    planNames: plans.map(p => p.name),
    planPrices: Object.fromEntries(plans.map(p => [p.name.toLowerCase().trim(), p.price])),
  });
  const missing = new Set<string>();
  for (const row of parsed.value.rows) {
    for (const w of row.warnings) {
      const m = w.match(/^No plan called "(.+)"/);
      if (m) missing.add(m[1]!);
    }
  }
  missingPlans.value = [...missing].slice(0, 5);
  step.value = "preview";
}

function handleFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) processFile(file);
}

function handleDrop(e: DragEvent) {
  dragOver.value = false;
  const file = e.dataTransfer?.files[0];
  if (file) processFile(file);
}

async function processFile(file: File) {
  fileError.value = "";
  if (/\.xlsx?$/i.test(file.name)) {
    fileError.value = "Excel files can't be read directly yet. Open the file, select all (Ctrl+A), copy (Ctrl+C), and paste it in the \"Paste a list\" tab. Or use File > Save As > CSV.";
    mode.value = "file";
    return;
  }
  await preview(await file.text());
}

// Send in chunks of 200 (the endpoint's limit) so big registers go in one go.
async function doImport() {
  importing.value = true;
  importedCount.value = 0;
  failedCount.value = 0;
  importErrors.value = [];
  const rows = readyRows.value;
  const CHUNK = 200;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    try {
      const res = await api<{ results: { success: boolean; error?: string }[] }>(
        `/api/orgs/${orgId.value}/members/import`,
        { method: "POST", body: JSON.stringify({ members: chunk.map(r => r.member) }) },
      );
      res.results.forEach((r, j) => {
        const row = chunk[j]!;
        if (r.success) importedCount.value++;
        else failedCount.value++;
        if (r.error) importErrors.value.push(`${row.member.name} (line ${row.line}): ${r.error}`);
      });
    }
    catch {
      failedCount.value += chunk.length;
      importErrors.value.push(`Lines ${chunk[0]!.line} to ${chunk[chunk.length - 1]!.line} failed to import. Please try again.`);
    }
  }
  importing.value = false;
  step.value = "results";
  if (importedCount.value) emit("imported", importedCount.value);
}

function downloadTemplate() {
  const csv = `${IMPORT_TEMPLATE_HEADERS.join(",")}\nAmit Sharma,9876543210,Monthly,05/01/2025,1000,UPI,Morning,,,,\n`;
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${t.value.membersLower}-template.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function reset() {
  step.value = "input";
  parsed.value = { rows: [], columns: {}, hasHeader: false };
  fileError.value = "";
  if (fileInput.value) fileInput.value.value = "";
}

defineExpose({ reset });
</script>
