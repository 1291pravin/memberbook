<template>
  <img
    ref="imgEl"
    :src="src"
    :alt="alt"
    :width="size"
    :height="size"
    loading="lazy"
    decoding="async"
    class="h-full w-full object-cover"
    @load="checkSize"
  >
</template>

<script setup lang="ts">
// A member's photo in a small circle. Loads the small thumbnail, which the
// browser keeps in its cache. Photos uploaded before thumbnails existed come
// back full size once; we then make the thumbnail here and save it, so the
// next load is small.
const props = withDefaults(defineProps<{
  orgId: number | string;
  memberId: number | string;
  photoKey: string;
  size?: number;
  alt?: string;
}>(), { size: 40, alt: "" });

const src = computed(() => memberPhotoUrl(props.orgId, props.memberId, props.photoKey));
const imgEl = ref<HTMLImageElement | null>(null);

// A server-rendered image can finish loading before the page is interactive,
// so check once on mount as well as on load.
onMounted(() => {
  if (imgEl.value?.complete && imgEl.value.naturalWidth) void checkSize();
});

async function checkSize() {
  const img = imgEl.value;
  if (!img || !img.naturalWidth) return;
  if (Math.max(img.naturalWidth, img.naturalHeight) <= MEMBER_THUMB_SIZE * 1.25) return;
  const key = props.photoKey;
  if (backfilled.has(key)) return;
  backfilled.add(key);
  try {
    const scale = MEMBER_THUMB_SIZE / Math.max(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const thumb = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/webp", 0.8));
    if (!thumb || thumb.type !== "image/webp") return;
    const form = new FormData();
    form.append("file", thumb, "thumb.webp");
    form.append("photoKey", key);
    await $fetch(`/api/orgs/${props.orgId}/members/${props.memberId}/photo-thumb`, { method: "POST", body: form });
  }
  catch {
    // Not important: the full photo still shows, and we try again next visit.
  }
}
</script>

<script lang="ts">
const backfilled = new Set<string>();
</script>
