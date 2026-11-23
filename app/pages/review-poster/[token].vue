<template>
  <div class="poster-page min-h-screen bg-slate-100 px-4 py-6">
    <div v-if="error" class="mx-auto max-w-sm rounded-3xl border border-slate-200 bg-white p-6 text-center">
      <h1 class="text-lg font-semibold text-slate-800">This poster link doesn't work</h1>
      <p class="mt-2 text-sm text-slate-600">Open More Google reviews in MemberBook to get the poster again.</p>
    </div>

    <template v-else-if="org">
      <div class="toolbar mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-base font-semibold text-slate-800">Your Google review poster</p>
          <p class="text-sm text-slate-600">Print it on A4, or send it to a print shop.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700" @click="print">
            Print or save PDF
          </button>
          <a
            :href="printShopLink"
            target="_blank"
            rel="noopener"
            class="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >Send to print shop</a>
        </div>
      </div>

      <!-- The A4 sheet. Sizes are in cqw (1% of the sheet width) so the screen preview matches the print. -->
      <div class="sheet-wrap mx-auto max-w-[210mm]">
        <ReviewPoster :name="org.name" :type="org.type" :short-url="shortUrl" />
      </div>

      <p class="tips mx-auto mt-4 max-w-[210mm] text-sm text-slate-600">
        Tip: laminate it and put one at the front desk and one near the exit, where people stand for a few seconds.
        Ask in person too: "If you like it here, could you rate us on Google?" works best right after a good session.
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const route = useRoute();
const token = String(route.params.token || "");
const config = useRuntimeConfig();
const appUrl = String(config.public.appUrl || "https://memberbook.in").replace(/\/$/, "");

const { data: org, error } = await useFetch<{ name: string; type: string }>(`/api/review-poster/${token}`, { key: `review-poster-${token}` });

useHead({
  title: () => org.value ? `Google review poster - ${org.value.name}` : "Google review poster",
  meta: [{ name: "robots", content: "noindex" }],
  link: [{ rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@600&display=swap" }],
});

const shortUrl = `${appUrl}/r/${token}`;
const printShopLink = computed(() => {
  const text = `Hi, please print this poster in colour on A4 (laminated if possible): ${appUrl}/review-poster/${token}\nOpen the link, tap "Print or save PDF". Thank you!`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
});

function print() {
  window.print();
}
</script>

<style scoped>
@media print {
  @page {
    size: A4 portrait;
    margin: 0;
  }
  .poster-page {
    background: #fff !important;
    padding: 0 !important;
    min-height: 0 !important;
  }
  .toolbar,
  .tips {
    display: none !important;
  }
  .sheet-wrap {
    max-width: none !important;
    width: 210mm;
    margin: 0;
  }
}
</style>
