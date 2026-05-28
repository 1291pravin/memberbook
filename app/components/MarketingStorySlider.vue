<template>
  <section class="story-slider" aria-labelledby="story-slider-title">
    <div class="story-slider__copy">
      <p class="story-slider__eyebrow">Built around your counter</p>
      <h2 id="story-slider-title">One flow, tuned for the way you collect fees.</h2>
      <p>
        MemberBook changes the words and priorities around your business, while keeping the daily workflow simple:
        know who is due, send the right WhatsApp reminder, record the payment.
      </p>
    </div>

    <div
      ref="sliderRef"
      class="story-slider__viewport"
      tabindex="0"
      role="region"
      aria-roledescription="carousel"
      aria-label="MemberBook use cases"
      @keydown.left.prevent="previousSlide"
      @keydown.right.prevent="nextSlide"
    >
      <article
        v-for="(slide, index) in slides"
        :key="slide.id"
        class="story-card"
        :class="[`story-card--${slide.tone || 'indigo'}`, { 'story-card--active': index === activeIndex }]"
        :aria-hidden="index !== activeIndex"
      >
        <div class="story-card__content">
          <span class="story-card__label">{{ slide.label }}</span>
          <h3>{{ slide.title }}</h3>
          <p>{{ slide.description }}</p>

          <NuxtLink :to="slide.primaryAction.to" class="story-card__link">
            {{ slide.primaryAction.label }}
            <span aria-hidden="true">-&gt;</span>
          </NuxtLink>
        </div>

        <div class="story-card__preview" aria-label="Sample dashboard preview">
          <div class="story-card__bar">
            <span />
            <span />
            <span />
            <strong>{{ slide.label }} desk</strong>
          </div>

          <div class="story-card__metrics">
            <div v-for="metric in slide.metrics" :key="metric.label" class="story-metric">
              <span>{{ metric.label }}</span>
              <strong>{{ metric.value }}</strong>
              <em v-if="metric.delta">{{ metric.delta }}</em>
            </div>
          </div>

          <div class="story-card__list">
            <div v-for="row in slide.previewRows" :key="row.name" class="story-row">
              <div>
                <strong>{{ row.name }}</strong>
                <span>{{ row.detail }}</span>
              </div>
              <div class="story-row__status">
                <span>{{ row.status }}</span>
                <em v-if="row.amount">{{ row.amount }}</em>
              </div>
            </div>
          </div>

          <div class="story-card__message">
            <span>WhatsApp queue</span>
            <strong>{{ slide.message }}</strong>
          </div>
        </div>
      </article>
    </div>

    <div class="story-slider__controls" aria-label="Slider controls">
      <button type="button" aria-label="Previous use case" @click="previousSlide">
        <span aria-hidden="true">&lt;</span>
      </button>

      <div class="story-slider__dots" role="tablist" aria-label="Choose use case">
        <button
          v-for="(slide, index) in slides"
          :key="slide.id"
          type="button"
          role="tab"
          :aria-selected="index === activeIndex"
          :aria-label="`Show ${slide.label}`"
          @click="goToSlide(index)"
        />
      </div>

      <button type="button" aria-label="Next use case" @click="nextSlide">
        <span aria-hidden="true">&gt;</span>
      </button>
    </div>

    <p class="sr-only" aria-live="polite">
      Showing {{ slides[activeIndex]?.label }} workflow.
    </p>
  </section>
</template>

<script setup lang="ts">
interface StoryMetric {
  label: string
  value: string
  delta?: string
}

interface StoryRow {
  name: string
  detail: string
  status: string
  amount?: string
}

interface StorySlide {
  id: string
  label: string
  title: string
  description: string
  metrics: StoryMetric[]
  primaryAction: {
    label: string
    to: string
  }
  previewRows: StoryRow[]
  tone?: "indigo" | "amber" | "green"
  message: string
}

const props = withDefaults(defineProps<{
  slides: StorySlide[]
  autoplay?: boolean
}>(), {
  autoplay: false,
});

const activeIndex = ref(0);
const sliderRef = ref<HTMLElement | null>(null);
let intervalId: ReturnType<typeof setInterval> | undefined;

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function goToSlide(index: number) {
  if (!props.slides.length) return;
  activeIndex.value = (index + props.slides.length) % props.slides.length;
}

function nextSlide() {
  goToSlide(activeIndex.value + 1);
}

function previousSlide() {
  goToSlide(activeIndex.value - 1);
}

watch(activeIndex, async () => {
  await nextTick();
  const viewport = sliderRef.value;
  const card = viewport?.querySelectorAll<HTMLElement>(".story-card")[activeIndex.value];
  card?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "nearest", inline: "center" });
});

onMounted(() => {
  if (!props.autoplay || prefersReducedMotion()) return;
  intervalId = setInterval(nextSlide, 6500);
});

onBeforeUnmount(() => {
  if (intervalId) clearInterval(intervalId);
});
</script>

<style scoped>
.story-slider {
  display: grid;
  gap: clamp(28px, 4vw, 48px);
}

.story-slider__copy {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.1fr);
  gap: clamp(24px, 4vw, 56px);
  align-items: end;
}

.story-slider__eyebrow {
  color: var(--ink-2);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.18em;
  margin: 0;
  text-transform: uppercase;
}

.story-slider__copy h2 {
  color: var(--ink);
  font-size: clamp(30px, 3.6vw, 50px);
  letter-spacing: -0.015em;
  line-height: 1.04;
  margin: 0;
}

.story-slider__copy p:last-child {
  color: var(--ink-2);
  font-size: clamp(16px, 1.4vw, 20px);
  line-height: 1.45;
  margin: 0;
  max-width: 50ch;
}

.story-slider__viewport {
  display: grid;
  grid-auto-columns: minmax(88%, 1fr);
  grid-auto-flow: column;
  gap: 18px;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}

.story-slider__viewport::-webkit-scrollbar {
  display: none;
}

.story-card {
  background: var(--paper);
  border: 1px solid var(--border);
  border-radius: 28px;
  box-shadow: var(--shadow-soft);
  display: grid;
  gap: clamp(20px, 4vw, 42px);
  grid-template-columns: minmax(0, 0.72fr) minmax(0, 1fr);
  min-height: 470px;
  overflow: hidden;
  padding: clamp(22px, 4vw, 42px);
  scroll-snap-align: center;
}

.story-card--active {
  border-color: var(--border-strong);
}

.story-card__content {
  align-self: center;
}

.story-card__label {
  background: var(--ink);
  border-radius: 999px;
  color: var(--paper);
  display: inline-flex;
  font-size: 12px;
  font-weight: 650;
  letter-spacing: 0.08em;
  padding: 6px 10px;
  text-transform: uppercase;
}

.story-card h3 {
  color: var(--ink);
  font-size: clamp(28px, 3.5vw, 48px);
  letter-spacing: -0.015em;
  line-height: 1.03;
  margin: 20px 0 0;
}

.story-card p {
  color: var(--ink-2);
  font-size: 16px;
  line-height: 1.55;
  margin: 18px 0 0;
  max-width: 38ch;
}

.story-card__link {
  align-items: center;
  color: var(--accent-2);
  display: inline-flex;
  font-weight: 700;
  gap: 8px;
  margin-top: 26px;
}

.story-card__preview {
  align-self: stretch;
  background: color-mix(in oklab, var(--paper-2) 75%, var(--paper));
  border: 1px solid var(--border);
  border-radius: 22px;
  display: grid;
  gap: 16px;
  padding: 16px;
}

.story-card__bar {
  align-items: center;
  display: flex;
  gap: 7px;
}

.story-card__bar span {
  background: var(--paper-3);
  border-radius: 999px;
  height: 10px;
  width: 10px;
}

.story-card__bar strong {
  color: var(--ink-2);
  font-size: 12px;
  margin-left: auto;
}

.story-card__metrics {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.story-metric {
  background: var(--paper);
  border: 1px solid var(--border);
  border-radius: 14px;
  min-width: 0;
  padding: 12px;
}

.story-metric span,
.story-card__message span,
.story-row span {
  color: var(--ink-3);
  display: block;
  font-size: 12px;
}

.story-metric strong {
  color: var(--ink);
  display: block;
  font-family: var(--font-heading);
  font-size: clamp(19px, 2.1vw, 27px);
  font-weight: 650;
  letter-spacing: -0.015em;
  margin-top: 6px;
}

.story-metric em,
.story-row em {
  color: var(--positive);
  display: block;
  font-size: 11px;
  font-style: normal;
  font-weight: 650;
  margin-top: 2px;
}

.story-card__list {
  background: var(--paper);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
}

.story-row {
  align-items: center;
  border-bottom: 1px solid var(--border);
  display: flex;
  gap: 12px;
  justify-content: space-between;
  padding: 13px 14px;
}

.story-row:last-child {
  border-bottom: 0;
}

.story-row strong {
  color: var(--ink);
  display: block;
  font-size: 14px;
}

.story-row__status {
  flex-shrink: 0;
  text-align: right;
}

.story-row__status span {
  color: var(--accent-2);
  font-weight: 650;
}

.story-card__message {
  background: var(--ink);
  border-radius: 16px;
  color: var(--paper);
  padding: 14px 16px;
}

.story-card__message span {
  color: var(--paper-3);
}

.story-card__message strong {
  display: block;
  font-size: 15px;
  margin-top: 5px;
}

.story-card--amber .story-card__label,
.story-card--amber .story-card__message {
  background: color-mix(in oklab, var(--accent-2) 74%, var(--ink));
}

.story-card--green .story-card__label,
.story-card--green .story-card__message {
  background: color-mix(in oklab, var(--positive) 76%, var(--ink));
}

.story-slider__controls {
  align-items: center;
  display: flex;
  gap: 16px;
  justify-content: center;
}

.story-slider__controls button {
  align-items: center;
  background: var(--paper);
  border: 1px solid var(--border-strong);
  border-radius: 999px;
  color: var(--ink);
  cursor: pointer;
  display: inline-flex;
  font-weight: 800;
  height: 42px;
  justify-content: center;
  transition: background-color 160ms ease, transform 160ms ease;
  width: 42px;
}

.story-slider__controls button:hover {
  background: var(--paper-2);
  transform: translateY(-1px);
}

.story-slider__controls button:focus-visible,
.story-slider__viewport:focus-visible {
  outline: 3px solid color-mix(in oklab, var(--accent) 55%, transparent);
  outline-offset: 3px;
}

.story-slider__dots {
  align-items: center;
  display: inline-flex;
  gap: 8px;
}

.story-slider__dots button {
  height: 10px;
  padding: 0;
  width: 10px;
}

.story-slider__dots button[aria-selected="true"] {
  background: var(--accent);
  border-color: var(--accent);
  width: 28px;
}

@media (min-width: 900px) {
  .story-slider__viewport {
    grid-auto-columns: 100%;
  }
}

@media (max-width: 760px) {
  .story-slider__copy,
  .story-card {
    grid-template-columns: 1fr;
  }

  .story-card {
    border-radius: 22px;
    min-height: auto;
  }

  .story-card__metrics {
    grid-template-columns: 1fr;
  }
}
</style>
