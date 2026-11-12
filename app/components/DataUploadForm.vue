<template>
  <form class="space-y-5" @submit.prevent="submit">
    <div>
      <p class="mb-1 text-sm font-medium text-slate-700">Your files</p>
      <label
        class="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-primary-300 bg-primary-50 px-4 py-8 text-center hover:border-primary-500 hover:bg-primary-100"
      >
        <svg class="h-10 w-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <span class="mt-2 text-base font-bold text-slate-800">Take photos or choose files</span>
        <span class="mt-1 text-xs text-slate-600">Excel, CSV, PDF, or photos of your register. Up to 10 files.</span>
        <input
          ref="fileInput"
          type="file"
          multiple
          class="sr-only"
          accept="image/*,.pdf,.csv,.xls,.xlsx,.ods,.txt"
          @change="onFiles"
        >
      </label>
      <ul v-if="files.length" class="mt-2 space-y-1">
        <li v-for="(file, i) in files" :key="i" class="flex items-center justify-between rounded bg-white px-3 py-1.5 text-sm text-slate-800 ring-1 ring-slate-200">
          <span class="truncate">{{ file.name }}</span>
          <button type="button" class="ml-2 shrink-0 text-xs font-medium text-red-700 hover:underline" @click="removeFile(i)">Remove</button>
        </li>
      </ul>
    </div>

    <div>
      <label for="upload-text" class="mb-1 block text-sm font-medium text-slate-700">Or paste your list</label>
      <textarea
        id="upload-text"
        v-model="text"
        rows="5"
        class="block w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        :placeholder="`Copy from Excel or WhatsApp, any format. For example:\nRahul Sharma 9876543210 Monthly paid till 5 Dec\nPriya 9123456780 Quarterly due 20 Nov`"
      />
    </div>

    <AppInput
      v-if="showUpi"
      v-model="upiId"
      label="Your UPI ID, so members can pay you directly (optional)"
      placeholder="e.g. 9876543210@ybl"
    />

    <AppInput
      v-model="note"
      label="Anything we should know? (optional)"
      placeholder="e.g. Monthly ₹800, quarterly ₹2,100. Red ink means unpaid."
    />

    <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      {{ error }}
    </div>

    <AppButton type="submit" size="lg" class="w-full" :loading="sending">
      Send my list
    </AppButton>
    <p class="text-center text-xs text-slate-600">
      We'll add your plans, {{ t.membersLower }} and due dates for you, usually within a few hours.
    </p>
  </form>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ showUpi?: boolean }>(), { showUpi: true });
const emit = defineEmits<{ uploaded: [id: number] }>();

const { orgId } = useOrg();
const t = useTerminology();

const fileInput = ref<HTMLInputElement | null>(null);
const files = ref<File[]>([]);
const text = ref("");
const note = ref("");
const upiId = ref("");
const sending = ref(false);
const error = ref("");

function onFiles(e: Event) {
  const input = e.target as HTMLInputElement;
  files.value = [...files.value, ...Array.from(input.files ?? [])].slice(0, 10);
  input.value = "";
}

function removeFile(i: number) {
  files.value.splice(i, 1);
}

async function submit() {
  error.value = "";
  if (!files.value.length && !text.value.trim()) {
    error.value = "Add a file or paste your list.";
    return;
  }
  sending.value = true;
  try {
    if (props.showUpi && upiId.value.trim()) {
      await $fetch(`/api/orgs/${orgId.value}/collections/settings`, {
        method: "PUT",
        body: { upiId: upiId.value.trim() },
      });
    }
    const form = new FormData();
    for (const file of files.value) form.append("files", file);
    if (text.value.trim()) form.append("text", text.value.trim());
    if (note.value.trim()) form.append("note", note.value.trim());
    const res = await $fetch<{ id: number }>(`/api/orgs/${orgId.value}/uploads`, { method: "POST", body: form });
    files.value = [];
    text.value = "";
    note.value = "";
    emit("uploaded", res.id);
  }
  catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } };
    error.value = err.data?.statusMessage || "Could not send. Check your internet and try again.";
  }
  finally {
    sending.value = false;
  }
}
</script>
