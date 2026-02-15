<template>
  <AppModal :open="open" :title="t.importMembers" size="lg" @close="handleClose">
    <!-- Step 1: Select File -->
    <div v-if="step === 'select'">
      <p class="text-sm text-slate-600 mb-3">
        Upload a CSV file with {{ t.memberLower }} data. Required column: <strong>name</strong>.
        Optional: phone, email, status, notes, plan, startDate, amountPaid, paymentMethod.
      </p>

      <div
        class="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-400 transition-colors"
        :class="{ 'border-primary-400 bg-primary-50': dragOver }"
        @click="fileInput?.click()"
        @dragover.prevent="dragOver = true"
        @dragleave="dragOver = false"
        @drop.prevent="handleDrop"
      >
        <p class="text-slate-600 text-sm">Click or drag a CSV file here</p>
        <input
          ref="fileInput"
          type="file"
          accept=".csv,text/csv"
          class="hidden"
          @change="handleFileSelect"
        >
      </div>

      <div class="mt-3">
        <button class="text-sm text-primary-600 hover:underline" @click="downloadSample">
          Download sample CSV
        </button>
      </div>
    </div>

    <!-- Step 2: Preview & Validate -->
    <div v-else-if="step === 'preview'">
      <div class="flex items-center justify-between mb-3">
        <div class="text-sm text-slate-600">
          <span class="text-green-600 font-medium">{{ validCount }} valid</span>
          <span v-if="errorCount > 0" class="ml-2 text-red-600 font-medium">{{ errorCount }} errors</span>
          <span class="ml-2 text-slate-600">of {{ previewRows.length }} rows</span>
        </div>
        <button class="text-sm text-slate-600 hover:underline" @click="reset">Change file</button>
      </div>

      <div class="max-h-72 overflow-auto border border-slate-200 rounded-lg">
        <table class="w-full text-xs">
          <thead class="bg-slate-50 sticky top-0">
            <tr>
              <th class="px-2 py-1 text-left text-slate-600">#</th>
              <th class="px-2 py-1 text-left text-slate-600">Name</th>
              <th class="px-2 py-1 text-left text-slate-600">Phone</th>
              <th class="px-2 py-1 text-left text-slate-600">Plan</th>
              <th class="px-2 py-1 text-left text-slate-600">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, i) in previewRows"
              :key="i"
              :class="row.error ? 'bg-red-50' : 'bg-green-50'"
            >
              <td class="px-2 py-1 text-slate-600">{{ i + 1 }}</td>
              <td class="px-2 py-1">{{ row.data.name || '—' }}</td>
              <td class="px-2 py-1">{{ row.data.phone || '—' }}</td>
              <td class="px-2 py-1">{{ row.data.plan || '—' }}</td>
              <td class="px-2 py-1">
                <span v-if="row.error" class="text-red-600">{{ row.error }}</span>
                <span v-else class="text-green-600">OK</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-4 flex justify-end gap-2">
        <AppButton variant="secondary" @click="handleClose">Cancel</AppButton>
        <AppButton :disabled="validCount === 0 || importing" @click="doImport">
          {{ importing ? 'Importing...' : `Import ${validCount} ${t.members}` }}
        </AppButton>
      </div>
    </div>

    <!-- Step 3: Results -->
    <div v-else-if="step === 'results'">
      <div class="space-y-2 mb-4">
        <p class="text-sm">
          <span class="text-green-600 font-medium">{{ importedCount }} imported</span>
          <span v-if="failedCount > 0" class="ml-2 text-red-600 font-medium">{{ failedCount }} failed</span>
        </p>

        <div v-if="importErrors.length > 0" class="max-h-40 overflow-auto text-xs space-y-1">
          <p v-for="(err, i) in importErrors" :key="i" class="text-red-600">
            Row {{ err.row }}: {{ err.message }}
          </p>
        </div>
      </div>

      <div class="flex justify-end">
        <AppButton @click="handleDone">Done</AppButton>
      </div>
    </div>
  </AppModal>
</template>

<script setup lang="ts">
defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
  imported: [];
}>();

const { orgId } = useOrg();
const t = useTerminology();
const { api } = useApi();
const { parseCsv } = useCsvParser();

const fileInput = ref<HTMLInputElement | null>(null);
const dragOver = ref(false);
const step = ref<"select" | "preview" | "results">("select");
const importing = ref(false);

interface ParsedRow {
  data: Record<string, string>;
  error: string | null;
}

const previewRows = ref<ParsedRow[]>([]);
const planNames = ref<string[]>([]);

const validCount = computed(() => previewRows.value.filter((r) => !r.error).length);
const errorCount = computed(() => previewRows.value.filter((r) => r.error).length);

const importedCount = ref(0);
const failedCount = ref(0);
const importErrors = ref<{ row: number; message: string }[]>([]);

const VALID_METHODS = ["cash", "upi", "card", "bank_transfer"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Fetch plans when file is loaded for validation
async function fetchPlans() {
  try {
    const res = await api<{ plans: { name: string }[] }>(`/api/orgs/${orgId.value}/plans`);
    planNames.value = res.plans.map((p) => p.name.toLowerCase().trim());
  }
  catch {
    planNames.value = [];
  }
}

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) processFile(file);
}

function handleDrop(e: DragEvent) {
  dragOver.value = false;
  const file = e.dataTransfer?.files[0];
  if (file) processFile(file);
}

async function processFile(file: File) {
  await fetchPlans();
  const text = await file.text();
  const { headers, rows } = parseCsv(text);

  if (headers.length === 0 || rows.length === 0) {
    previewRows.value = [];
    step.value = "preview";
    return;
  }

  if (rows.length > 200) {
    previewRows.value = [{ data: { name: "" }, error: `File has ${rows.length} rows. Maximum is 200 per import.` }];
    step.value = "preview";
    return;
  }

  // Map CSV columns to expected fields (case-insensitive)
  const headerMap = new Map<string, number>();
  headers.forEach((h, i) => headerMap.set(h.toLowerCase().trim(), i));

  const fields = ["name", "phone", "email", "status", "notes", "plan", "startDate", "amountPaid", "paymentMethod"];

  previewRows.value = rows.map((cols) => {
    const data: Record<string, string> = {};
    for (const field of fields) {
      const idx = headerMap.get(field.toLowerCase());
      data[field] = idx != null ? (cols[idx]?.trim() ?? "") : "";
    }
    const error = validateRow(data);
    return { data, error };
  });

  step.value = "preview";
}

function validateRow(data: Record<string, string>): string | null {
  if (!data.name) return "Name is required";
  if (data.plan && !planNames.value.includes(data.plan.toLowerCase().trim())) {
    return `Plan "${data.plan}" not found`;
  }
  if (data.plan && !data.startDate) return "Start date required when plan is specified";
  if (data.startDate && !DATE_RE.test(data.startDate)) return "Start date must be YYYY-MM-DD";
  if (data.amountPaid && (isNaN(Number(data.amountPaid)) || Number(data.amountPaid) < 0)) {
    return "Amount paid must be a positive number";
  }
  if (data.paymentMethod && !VALID_METHODS.includes(data.paymentMethod)) {
    return `Invalid payment method. Use: ${VALID_METHODS.join(", ")}`;
  }
  return null;
}

async function doImport() {
  importing.value = true;
  const validRows = previewRows.value
    .filter((r) => !r.error)
    .map((r) => ({
      name: r.data.name,
      phone: r.data.phone || undefined,
      email: r.data.email || undefined,
      status: r.data.status || undefined,
      notes: r.data.notes || undefined,
      plan: r.data.plan || undefined,
      startDate: r.data.startDate || undefined,
      amountPaid: r.data.amountPaid ? Number(r.data.amountPaid) : undefined,
      paymentMethod: r.data.paymentMethod || undefined,
    }));

  try {
    const res = await api<{ results: { success: boolean; error?: string }[] }>(
      `/api/orgs/${orgId.value}/members/import`,
      { method: "POST", body: JSON.stringify({ members: validRows }) },
    );

    importedCount.value = res.results.filter((r) => r.success && !r.error).length;
    // Count rows with warnings (success but with error message) separately
    const warnings = res.results.filter((r) => r.success && r.error);
    failedCount.value = res.results.filter((r) => !r.success).length;
    importedCount.value += warnings.length;

    importErrors.value = res.results
      .map((r, i) => r.error ? { row: i + 1, message: r.error } : null)
      .filter((e): e is { row: number; message: string } => e !== null);

    step.value = "results";
  }
  catch {
    importErrors.value = [{ row: 0, message: "Import failed. Please try again." }];
    failedCount.value = validRows.length;
    step.value = "results";
  }
  finally {
    importing.value = false;
  }
}

function downloadSample() {
  const csv = "name,phone,email,status,notes,plan,startDate,amountPaid,paymentMethod\nJohn Doe,9876543210,john@example.com,active,New member,Monthly Plan,2025-01-01,500,upi\nJane Smith,9876543211,,active,,,,\n";
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "members_sample.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function reset() {
  step.value = "select";
  previewRows.value = [];
  if (fileInput.value) fileInput.value.value = "";
}

function handleClose() {
  reset();
  importedCount.value = 0;
  failedCount.value = 0;
  importErrors.value = [];
  emit("close");
}

function handleDone() {
  emit("imported");
  handleClose();
}
</script>
