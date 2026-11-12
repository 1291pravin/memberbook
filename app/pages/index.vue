<template>
  <div ref="homeRef" class="mb" :class="{ 'scroll-reveal-ready': scrollRevealReady }">
    <!-- ───────────────────────── Hero + demo video ───────────────────────── -->
    <section class="hero">
      <div class="wrap">
        <div class="hero-layout-split">
          <div class="hero-copy">
            <span class="eyebrow">For gyms, libraries and coaching centres</span>
            <h1 style="margin-top: 22px;">
              We load your register.
              You get paid <span class="strike">late</span> on time.
            </h1>
            <p class="hero-sub">
              Send us a photo of your register. We set up everything for you, free. Every morning you see who to collect from.
            </p>
            <div class="hero-ctas">
              <a :href="setupLink" :target="setupLink.startsWith('http') ? '_blank' : undefined" rel="noopener" class="btn btn-accent" @click="trackCtaClick('home_hero_send_register')">
                <IcWhatsapp v-if="setupLink.startsWith('http')" :size="15" color="currentColor" /> Send us your register
              </a>
              <NuxtLink to="/register" class="btn btn-ghost" @click="trackCtaClick('home_hero_self_serve')">
                Or set it up yourself
              </NuxtLink>
            </div>
            <div class="hero-note">
              <span v-for="n in heroNotes" :key="n" style="display: inline-flex; align-items: center; gap: 6px;">
                <span class="check"><IcCheck :size="9" /></span> {{ n }}
              </span>
            </div>
          </div>

          <div id="demo" class="hero-stage">
            <figure class="hero-photo-frame demo-frame">
              <video
                ref="demoVideo"
                poster="/brand/memberbook-demo-poster.webp"
                width="1280"
                height="720"
                autoplay
                muted
                loop
                playsinline
                controls
                preload="metadata"
                aria-label="45 second demo: a gym's members, fees due, a reminder with a UPI pay link, and add-ons in MemberBook"
              >
                <source src="/brand/memberbook-demo.webm" type="video/webm">
                <source src="/brand/memberbook-demo.mp4" type="video/mp4">
              </video>
            </figure>
            <p class="demo-caption">A 45-second look at a sample gym</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ───────────────────── How it works ───────────────────── -->
    <section id="how-it-works" class="section" style="background: var(--paper);">
      <div class="wrap" data-scroll-reveal>
        <div class="sec-head">
          <div>
            <span class="eyebrow">How it works</span>
            <h2 style="margin-top: 16px;">You send a photo. <em>We do the typing.</em></h2>
          </div>
        </div>

        <div class="workflow-grid workflow-grid--three workflow-grid--compact">
          <article v-for="(item, index) in setupSteps" :key="item.title" class="workflow-card">
            <span class="workflow-card__step">STEP {{ String(index + 1).padStart(2, "0") }}</span>
            <div class="workflow-card__icon">
              <component :is="item.icon" :size="19" />
            </div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.text }}</p>
          </article>
        </div>

        <p class="audience-line">
          Made for
          <NuxtLink to="/gym">gyms</NuxtLink>,
          <NuxtLink to="/library">libraries</NuxtLink> and
          <NuxtLink to="/tuition">coaching centres</NuxtLink>.
          Looking for <NuxtLink to="/member-book">Member Book software</NuxtLink>?
        </p>
      </div>
    </section>

    <!-- ───────────────────── Pricing ───────────────────── -->
    <section id="pricing" class="section" style="background: var(--paper-2);">
      <div class="wrap" data-scroll-reveal>
        <div class="sec-head">
          <div>
            <span class="eyebrow">Pricing</span>
            <h2 style="margin-top: 16px;">Free forever. <em>Add more when you need it.</em></h2>
          </div>
          <p>No card, no contract. Paid add-ons are optional, start with a free month, and you can stop any time.</p>
        </div>

        <div class="price-split">
          <div class="plan featured">
            <h3>MemberBook</h3>
            <div class="price">₹0<small> forever</small></div>
            <ul>
              <li v-for="f in freeFeatures" :key="f">{{ f }}</li>
            </ul>
            <a
              v-if="setupLink.startsWith('http')"
              :href="setupLink"
              target="_blank"
              rel="noopener"
              class="btn btn-accent"
              style="margin-top: auto;"
              @click="trackCtaClick('home_pricing_done_for_you')"
            >Send us your register</a>
            <NuxtLink
              v-else
              to="/register"
              class="btn btn-accent"
              style="margin-top: auto;"
              @click="trackCtaClick('home_pricing_free')"
            >Start free</NuxtLink>
          </div>

          <div class="addon-list">
            <h3>Add-ons</h3>
            <ul>
              <li v-for="a in pricedAddOns" :key="a.key" :class="{ soon: !a.ready }">
                <div>
                  <strong>{{ a.name }}</strong>
                  <span>{{ a.tagline }}</span>
                </div>
                <div class="addon-price">
                  <template v-if="a.price">{{ formatRupees(a.price) }}<small>/month</small></template>
                  <template v-else>Free</template>
                  <em v-if="!a.ready">Coming soon</em>
                </div>
              </li>
            </ul>
            <p class="addon-note">First month free on every paid add-on. Switch them on from the app.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ───────────────────── FAQ ───────────────────── -->
    <section id="faq" class="section" style="background: var(--paper);">
      <div class="wrap" data-scroll-reveal>
        <div class="sec-head">
          <div>
            <span class="eyebrow">Questions</span>
            <h2 style="margin-top: 16px;">Before you <em>send your register.</em></h2>
          </div>
          <p v-if="whatsappDisplay">Something else? Message us on WhatsApp at {{ whatsappDisplay }}. A person replies.</p>
          <p v-else-if="email">Something else? Email <a :href="`mailto:${email}`">{{ email }}</a>. A person replies.</p>
        </div>
        <div class="faq-list">
          <div v-for="f in faqs" :key="f.question" class="faq-item">
            <h3 class="faq-q">{{ f.question }}</h3>
            <p>{{ f.answer }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ───────────────────── CTA panel ───────────────────── -->
    <section class="section">
      <div class="wrap">
        <div class="cta-panel" data-scroll-reveal>
          <div>
            <h2>
              Send a photo today. <br>
              <em>Start collecting tomorrow.</em>
            </h2>
          </div>
          <div class="right">
            <div class="ctas">
              <a :href="setupLink" :target="setupLink.startsWith('http') ? '_blank' : undefined" rel="noopener" class="btn btn-accent" @click="trackCtaClick('home_cta_send_register')">
                <IcWhatsapp v-if="setupLink.startsWith('http')" :size="15" color="currentColor" /> Send us your register
              </a>
              <NuxtLink to="/register" class="btn btn-ghost" @click="trackCtaClick('home_cta_self_serve')">Set it up myself</NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { h } from "vue";
import type { FunctionalComponent, VNode } from "vue";

definePageMeta({ layout: "default" });

const config = useRuntimeConfig();
const appUrl = config.public.appUrl || "https://memberbook.in";
const { trackCtaClick } = useAnalytics();
const { whatsappDisplay, setupHref, email } = useSupport();

const setupMessage = "Hi MemberBook team, I want you to set up my register.\n\nBusiness name:\nType (gym / library / coaching):\nCity:\nNumber of members (approx):\n\nI'll send photos of the register / Excel sheet next.";
const setupLink = computed(() => setupHref(setupMessage));
const homeRef = ref<HTMLElement | null>(null);
const demoVideo = ref<HTMLVideoElement | null>(null);
const scrollRevealReady = ref(false);
let scrollRevealObserver: IntersectionObserver | undefined;

onMounted(async () => {
  const home = homeRef.value;
  if (!home) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Don't autoplay the demo for people who asked for less motion; the controls still work.
  if (prefersReducedMotion) demoVideo.value?.pause();

  if (prefersReducedMotion || !("IntersectionObserver" in window)) return;

  scrollRevealReady.value = true;
  await nextTick();

  scrollRevealObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-visible");
      scrollRevealObserver?.unobserve(entry.target);
    }
  }, {
    threshold: 0.12,
    rootMargin: "0px 0px -12% 0px",
  });

  home.querySelectorAll<HTMLElement>("[data-scroll-reveal]").forEach(target => scrollRevealObserver?.observe(target));
});

onBeforeUnmount(() => {
  scrollRevealObserver?.disconnect();
});

/* ── Inline icon set (line-style, currentColor) ───────────────── */
type IconProps = { size?: number; color?: string };
const icon = (
  build: (p: IconProps) => VNode[],
  vb = "0 0 24 24",
  w = 1.7,
): FunctionalComponent<IconProps> => (p) =>
  h(
    "svg",
    {
      width: p.size ?? 18,
      height: p.size ?? 18,
      viewBox: vb,
      fill: "none",
      stroke: p.color ?? "currentColor",
      "stroke-width": w,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    build(p),
  );

const IcUsers = icon(() => [
  h("circle", { cx: 9, cy: 8, r: 3.5 }),
  h("path", { d: "M2.5 19c.5-3 3.5-5 6.5-5s5.5 2 6.5 5" }),
  h("circle", { cx: 17, cy: 9, r: 2.5 }),
  h("path", { d: "M16 14.5c2.4.2 4.5 1.8 5.5 4" }),
]);
const IcRupee = icon(() => [h("path", { d: "M7 5h10M7 9h10M7 9c4 0 6 1.5 6 4s-2 4-6 4l8 6" })]);
const IcCheck = icon(() => [h("path", { d: "M5 12.5 10 17 19 7" })], "0 0 24 24", 3);
const IcPhone = icon(() => [h("path", { d: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z" })]);
const IcWhatsapp: FunctionalComponent<IconProps> = (p) =>
  h("svg", { width: p.size ?? 18, height: p.size ?? 18, viewBox: "0 0 24 24", fill: p.color ?? "currentColor" }, [
    h("path", { d: "M19.05 4.91A10 10 0 0 0 2.05 14.83l-1.4 5.16 5.28-1.39A10 10 0 1 0 19.05 4.9zm-7.04 15.37a8 8 0 0 1-4.06-1.11l-.29-.17-3.13.82.83-3.05-.19-.31a8 8 0 1 1 6.84 3.82zm4.39-6c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1-.37-1.92-1.18-.71-.63-1.18-1.41-1.32-1.65-.14-.24-.02-.37.1-.49.1-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.18 1.1.16 1.52.1.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z" }),
  ]);

/* ── Copy ───────────────────────────────────────────────────────────── */
const heroNotes = ["Free forever", "Setup done for you", "Works on any phone"];

const setupSteps = [
  { icon: IcPhone, title: "Send your register", text: "Photos, Excel or a typed list. Messy handwriting is fine." },
  { icon: IcUsers, title: "We load it, free", text: "Every member, plan and due date, usually within a working day." },
  { icon: IcRupee, title: "Collect on time", text: "See who is due each morning. Send a reminder with your UPI pay link in one tap." },
];

/* ── Pricing ──────────────────────────────────────────────────────────
 * The free plan is one list. Add-on names and prices come from the same
 * catalog as /dashboard/add-ons (shared/utils/add-ons.ts), so they never drift.
 */
const freeFeatures = [
  "Members, plans and payments",
  "Fees due list and one-tap WhatsApp reminders",
  "UPI pay link for every member",
  "We load your register for you",
  "Staff logins and more than one branch",
];

const pricedAddOns = ADD_ONS.filter(a => a.ready || ["auto_reminders", "front_desk"].includes(a.key));

function formatRupees(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

const faqs: { question: string; answer: string }[] = [
  { question: "Is it really free?", answer: "Yes. The app and setup are free forever, with no card and no contract. You only pay if you switch on a paid add-on, like your own website, and every paid add-on starts with a free month." },
  { question: "How long does setup take?", answer: "Usually one working day after we get your register. You get a login, check everything, and tell us anything to fix." },
  { question: "Do my members need to install anything?", answer: "No. They get WhatsApp messages and pay by UPI. The app is for you and your staff, on any phone or computer." },
  { question: "Is my data safe?", answer: "Only you and the staff you add can see it. We never share or sell your members' numbers, and you can export everything to Excel any time." },
];

/* ── SEO ────────────────────────────────────────────────────────────── */
const seoTitle = "Free Gym, Library & Coaching Fee Software, Set Up for You | MemberBook";
const seoDescription = "Free forever software for Indian gyms, libraries and coaching centres. Send us your register and we load every member, plan and due date for you. See who to collect from every morning.";

useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  ogTitle: seoTitle,
  ogDescription: seoDescription,
  ogImage: `${appUrl}/og-image.png`,
  ogUrl: appUrl,
  ogType: "website",
  ogVideo: `${appUrl}/brand/memberbook-demo.mp4`,
  twitterCard: "summary_large_image",
  twitterTitle: seoTitle,
  twitterDescription: seoDescription,
  twitterImage: `${appUrl}/og-image.png`,
});

useHead({
  link: [{ rel: "canonical", href: appUrl }],
  script: [
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "MemberBook",
        "url": appUrl,
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web Browser",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR", "description": "Free forever, setup included" },
        "description": seoDescription,
      }),
    },
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "VideoObject",
        "name": "MemberBook demo",
        "description": "A 45-second tour of MemberBook on a sample gym: members, fees due, a WhatsApp reminder with a UPI pay link, and add-ons.",
        "thumbnailUrl": `${appUrl}/brand/memberbook-demo-poster.webp`,
        "contentUrl": `${appUrl}/brand/memberbook-demo.mp4`,
        "uploadDate": "2026-11-12",
        "duration": "PT44S",
      }),
    },
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": { "@type": "Answer", "text": faq.answer },
        })),
      }),
    },
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "MemberBook",
        "url": appUrl,
        "logo": `${appUrl}/logo.png`,
        "description": "Free member and fee software, set up for you, for Indian gyms, libraries and coaching centres",
        "address": { "@type": "PostalAddress", "addressCountry": "IN" },
        "areaServed": { "@type": "Country", "name": "India" },
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer support",
          "telephone": `+${config.public.supportWhatsappNumber}`,
          "availableLanguage": ["English", "Hindi"],
          "areaServed": "IN",
        },
      }),
    },
  ],
});
</script>
