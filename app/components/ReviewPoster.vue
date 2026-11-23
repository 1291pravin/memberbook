<template>
  <article class="sheet" aria-label="Google review poster">
    <header class="band">
      <p class="biz" :class="{ long: name.length > 34 }">{{ name }}</p>
    </header>

    <div class="body">
      <div class="intro">
        <h2 class="headline">{{ copy.headline }}</h2>
        <p class="sub">Rate us on Google</p>
        <div class="stars" aria-label="5 stars">
          <svg v-for="i in 5" :key="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5l-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9z" /></svg>
        </div>
      </div>

      <div class="qr-card">
        <div class="qr" v-html="qr" />
        <p class="scan-tag">Scan with your phone camera</p>
      </div>

      <ol class="steps">
        <li><span>1</span>Scan the code</li>
        <li><span>2</span>Tap the stars</li>
        <li><span>3</span>Write a line</li>
      </ol>

      <div>
        <p class="hindi" lang="hi">{{ copy.hindi }}</p>
        <p class="thanks">{{ copy.thanks }}</p>
      </div>
    </div>

    <footer class="foot">
      <span class="link">{{ shortLabel }}</span>
      <span class="by"><BrandMark :size="14" /> memberbook.in</span>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { renderSVG } from "uqr";

// The printable A4 Google review poster. Sizes are in cqw (1% of the sheet's
// width) so a phone preview, the dashboard thumbnail and the print all match.
const props = defineProps<{ name: string; type?: string | null; shortUrl: string }>();
const shortLabel = computed(() => props.shortUrl.replace(/^https?:\/\//, ""));
const qr = computed(() => renderSVG(props.shortUrl, { border: 0, ecc: "Q" })
  .replace("<svg ", "<svg width=\"100%\" height=\"100%\" role=\"img\" aria-label=\"QR code for our Google review page\" "));

const copy = computed(() => {
  switch (props.type) {
    case "gym":
      return { headline: "Loved your workout?", hindi: "कैमरा से स्कैन करें और Google पर हमें रेटिंग दें", thanks: "Your review helps more people find a good gym. Thank you!" };
    case "library":
      return { headline: "Like studying here?", hindi: "कैमरा से स्कैन करें और Google पर हमें रेटिंग दें", thanks: "Your review helps other students find a good place to study. Thank you!" };
    case "tuition":
      return { headline: "Happy with your classes?", hindi: "कैमरा से स्कैन करें और Google पर हमें रेटिंग दें", thanks: "Your review helps other parents and students find us. Thank you!" };
    default:
      return { headline: "Enjoying your time here?", hindi: "कैमरा से स्कैन करें और Google पर हमें रेटिंग दें", thanks: "Your review helps more people find us. Thank you!" };
  }
});
</script>

<style scoped>
.sheet {
  container-type: inline-size;
  width: 100%;
  aspect-ratio: 210 / 297;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgb(15 23 42 / 0.12), 0 10px 30px rgb(15 23 42 / 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  color: #1e293b;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.band {
  background: #0f766e;
  color: #fff;
  padding: 4cqw 7cqw 3.6cqw;
  text-align: center;
  position: relative;
}
.band::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1.2cqw;
  background: #ff7a59;
}
.biz {
  font-size: 6.2cqw;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.01em;
  overflow-wrap: anywhere;
}
.biz.long {
  font-size: 5cqw;
}
.body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  padding: 2cqw 8cqw;
  text-align: center;
  line-height: 1.25;
}
.headline {
  font-size: 8.2cqw;
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.02em;
  color: #1e293b;
}
.sub {
  margin-top: 1cqw;
  font-size: 5.6cqw;
  font-weight: 700;
  color: #0f766e;
}
.intro {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.stars {
  display: flex;
  gap: 1.2cqw;
  margin-top: 1.2cqw;
}
.stars svg {
  width: 6.6cqw;
  height: 6.6cqw;
  fill: #f59e0b;
}
.qr-card {
  border: 0.8cqw solid #0f766e;
  border-radius: 4cqw;
  padding: 3.4cqw 3.4cqw 2cqw;
  background: #fff;
}
.qr {
  width: 41cqw;
  height: 41cqw;
  color: #0f172a;
}
.scan-tag {
  margin-top: 1.8cqw;
  font-size: 3.4cqw;
  font-weight: 700;
  color: #1e293b;
}
.steps {
  display: flex;
  justify-content: center;
  gap: 4cqw;
  margin: 0;
  font-size: 3.4cqw;
  font-weight: 600;
  color: #334155;
  list-style: none;
  padding: 0;
}
.steps li {
  display: flex;
  align-items: center;
  gap: 1.4cqw;
  white-space: nowrap;
}
.steps span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 5cqw;
  height: 5cqw;
  border-radius: 999px;
  background: #ccfbf1;
  color: #115e59;
  font-weight: 800;
  font-size: 3cqw;
}
.hindi {
  font-family: "Noto Sans Devanagari", var(--font-body);
  font-size: 3.5cqw;
  font-weight: 600;
  color: #334155;
}
.thanks {
  margin-top: 1cqw;
  font-size: 2.8cqw;
  color: #475569;
  max-width: 80cqw;
}
.foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2.4cqw 6cqw;
  font-size: 2.3cqw;
  color: #475569;
  border-top: 0.3cqw solid #e2e8f0;
}
.foot .by {
  display: inline-flex;
  align-items: center;
  gap: 1cqw;
}
.foot .by :deep(svg) {
  width: 3cqw;
  height: 3cqw;
}

@media print {
  .sheet {
    width: 210mm;
    height: 297mm;
    aspect-ratio: auto;
    border-radius: 0;
    box-shadow: none;
    break-inside: avoid;
  }
}
</style>
