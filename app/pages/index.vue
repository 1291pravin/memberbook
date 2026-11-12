<template>
  <div ref="homeRef" class="mb" :class="{ 'scroll-reveal-ready': scrollRevealReady }">
    <!-- ───────────────────────── Hero ───────────────────────── -->
    <section class="hero">
      <div class="wrap">
        <div class="hero-layout-split">
          <div class="hero-copy">
            <span class="eyebrow">For gyms, libraries and coaching centres in India</span>
            <h1 style="margin-top: 22px;">
              We load your register.
              You get paid <span class="strike">late</span> on time.
            </h1>
            <p class="hero-sub">
              Send us a photo of your member register or your Excel sheet. We put every member, plan and due date into MemberBook
              for you, set up WhatsApp renewal reminders with your UPI details, and every morning you see exactly who to collect from.
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
              <span style="display: inline-flex; align-items: center; gap: 6px;">
                <span class="check"><IcCheck :size="9" /></span> Setup done for you, free
              </span>
              <span style="display: inline-flex; align-items: center; gap: 6px;">
                <span class="check"><IcCheck :size="9" /></span> Free to use, no card
              </span>
              <span style="display: inline-flex; align-items: center; gap: 6px;">
                <span class="check"><IcCheck :size="9" /></span> Works on any phone
              </span>
            </div>
            <p style="margin-top: 18px; font-size: 13px; color: var(--ink-2);">
              Looking for &ldquo;Member Book&rdquo; software?
              <NuxtLink to="/member-book" style="color: var(--accent-2); text-decoration: underline; text-underline-offset: 2px;">See why MemberBook is the right fit.</NuxtLink>
            </p>
          </div>

          <div class="hero-stage">
            <figure class="hero-photo-frame">
              <img
                src="/brand/homepage-hero.webp"
                alt="Gym owner viewing MemberBook dashboard and WhatsApp payment reminders"
                width="1600"
                height="900"
                fetchpriority="high"
              >
            </figure>
            <!-- Floating chips -->
            <div class="floater" style="top: 8%; left: 4%; transform: rotate(-3deg);">
              <div class="ic" style="background: var(--positive-soft); color: var(--positive);"><IcCheckCircle :size="16" /></div>
              <div>
                <div style="font-weight: 600;">&#8377;3,000 collected</div>
                <div class="small">Priya &middot; Cardio Quarterly</div>
              </div>
            </div>
            <div class="floater" style="bottom: 8%; right: 4%; transform: rotate(2deg);">
              <div class="ic" style="background: #DCF8C6; color: #075E54;"><IcWhatsapp :size="16" color="#075E54" /></div>
              <div>
                <div style="font-weight: 600;">12 renewals due this week</div>
                <div class="small">Reminders ready to send</div>
              </div>
            </div>
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
          <p>Most owners give up on software at the same step: typing 200 members in by hand. So we do that part for you, and you start with a book that is already full.</p>
        </div>

        <div class="workflow-grid workflow-grid--three">
          <article v-for="(item, index) in setupSteps" :key="item.title" class="workflow-card">
            <span class="workflow-card__step">STEP {{ String(index + 1).padStart(2, "0") }}</span>
            <div class="workflow-card__icon">
              <component :is="item.icon" :size="19" />
            </div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.text }}</p>
            <div class="workflow-card__sample">
              <strong>{{ item.sample }}</strong>
              <span>{{ item.meta }}</span>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- ───────────────────── Daily view ───────────────────── -->
    <section class="section story-section">
      <div class="wrap" data-scroll-reveal>
        <MarketingStorySlider :slides="storySlides" />
      </div>
    </section>

    <!-- ───────────────────── Before / after ───────────────────── -->
    <section id="why" class="section" style="background: var(--paper);">
      <div class="wrap" data-scroll-reveal>
        <div class="sec-head">
          <div>
            <span class="eyebrow">Why done-for-you</span>
            <h2 style="margin-top: 16px;">Fees come in on time <em>when someone reminds.</em></h2>
          </div>
          <p>Members rarely refuse to pay. They forget, and the owner is too busy to chase everyone. MemberBook makes the reminding automatic and the chasing short.</p>
        </div>
        <div class="compare-grid">
          <div class="compare-card">
            <h3>Without MemberBook</h3>
            <ul>
              <li v-for="row in compareRows" :key="row.before">{{ row.before }}</li>
            </ul>
          </div>
          <div class="compare-card compare-card--after">
            <h3>With MemberBook</h3>
            <ul>
              <li v-for="row in compareRows" :key="row.after">{{ row.after }}</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section class="section audience-section">
      <div class="wrap" data-scroll-reveal>
        <div class="audience-grid">
          <div class="audience-copy">
            <span class="eyebrow">One book, three everyday businesses</span>
            <h2 style="margin-top: 16px;">Made for the counters where renewals actually happen.</h2>
            <p>
              We set MemberBook up in the words your business uses: plans for gyms,
              seats and shifts for libraries, batches for coaching centres.
            </p>
            <div class="audience-list">
              <NuxtLink v-for="row in audienceRows" :key="row.title" :to="row.to" class="audience-row" style="text-decoration: none; color: inherit;">
                <div class="audience-icon">
                  <component :is="row.icon" :size="17" />
                </div>
                <div>
                  <h3>{{ row.title }}</h3>
                  <p>{{ row.text }}</p>
                </div>
              </NuxtLink>
            </div>
          </div>
          <figure class="audience-art">
            <img
              src="/brand/membership-verticals.webp"
              alt="Gym, library, and coaching centre counters using MemberBook on phones"
              width="1200"
              height="1200"
              loading="lazy"
            >
            <figcaption>Gym renewals, library seats, coaching fee reminders, all sharing the same simple flow.</figcaption>
          </figure>
        </div>
      </div>
    </section>

    <!-- ───────────────────── WhatsApp ───────────────────── -->
    <section id="whatsapp" class="section" style="background: var(--paper-2);">
      <div class="wrap" data-scroll-reveal>
        <div class="wa-grid">
          <div>
            <span class="eyebrow"><IcWhatsapp :size="11" color="currentColor" /> Reminders on WhatsApp</span>
            <h2 style="margin-top: 16px; font-size: var(--fs-h2); color: var(--ink);">
              Members already live on WhatsApp.<br>
              <em style="font-style: italic; color: var(--accent); font-family: var(--font-heading); font-weight: 500;">Remind them there.</em>
            </h2>
            <p style="color: var(--ink-2); font-size: var(--fs-lead); max-width: 42ch; margin-top: 20px;">
              Renewal reminders go from your own WhatsApp number, in Hindi or English, with the amount and your UPI ID inside. Members reply to you, not to a bot.
            </p>
            <div style="display: flex; flex-direction: column; gap: 14px; margin-top: 32px;">
              <div v-for="row in waRows" :key="row.t" style="display: flex; gap: 14px; align-items: flex-start;">
                <div style="width: 32px; height: 32px; border-radius: 10px; background: var(--paper); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--accent-2);">
                  <component :is="row.icon" :size="14" :color="row.iconColor || 'currentColor'" />
                </div>
                <div>
                  <div style="font-weight: 600; font-size: 16px;">{{ row.t }}</div>
                  <div style="color: var(--ink-2); font-size: 14.5px; margin-top: 2px;">{{ row.d }}</div>
                </div>
              </div>
            </div>
          </div>
          <div style="position: relative; display: flex; justify-content: center;">
            <WhatsAppMock />
          </div>
        </div>
      </div>
    </section>

    <!-- ───────────────────── Pricing ───────────────────── -->
    <section id="pricing" class="section" style="background: var(--paper);">
      <div class="wrap" data-scroll-reveal>
        <div class="sec-head">
          <div>
            <span class="eyebrow">Pricing</span>
            <h2 style="margin-top: 16px;">MemberBook is free. <em>Setup included.</em></h2>
          </div>
          <p>{{ pricingNote }}</p>
        </div>
        <div class="pricing">
          <div v-for="plan in pricingPlans" :key="plan.name" class="plan" :class="{ featured: plan.featured }">
            <span v-if="plan.ribbon" class="ribbon">{{ plan.ribbon }}</span>
            <h3>{{ plan.name }}</h3>
            <p class="blurb">{{ plan.blurb }}</p>
            <div class="price" :style="plan.priceSmall ? 'font-size: 34px;' : ''">{{ plan.price }}<small v-if="plan.priceUnit">{{ plan.priceUnit }}</small></div>
            <ul>
              <li v-for="f in plan.features" :key="f">{{ f }}</li>
            </ul>
            <a
              v-if="plan.cta.whatsapp && whatsappLink(plan.cta.whatsapp)"
              :href="whatsappLink(plan.cta.whatsapp)"
              target="_blank"
              rel="noopener"
              class="btn"
              :class="plan.featured ? 'btn-accent' : 'btn-ghost'"
              style="margin-top: auto;"
              @click="trackCtaClick(plan.cta.track)"
            >{{ plan.cta.label }}</a>
            <NuxtLink
              v-else
              :to="plan.cta.to || '/register'"
              class="btn"
              :class="plan.featured ? 'btn-accent' : 'btn-ghost'"
              style="margin-top: auto;"
              @click="trackCtaClick(plan.cta.track)"
            >{{ plan.cta.label }}</NuxtLink>
          </div>
        </div>
        <p style="margin-top: 24px; font-size: 13px; color: var(--ink-2); text-align: center;">
          Not sure how much your gym loses to late renewals?
          <NuxtLink to="/tools/gym-membership-revenue-calculator" style="color: var(--accent-2); text-decoration: underline; text-underline-offset: 2px;">Try the free revenue calculator.</NuxtLink>
        </p>
      </div>
    </section>

    <!-- ───────────────────── FAQ ───────────────────── -->
    <section id="faq" class="section" style="background: var(--paper-2);">
      <div class="wrap" data-scroll-reveal>
        <div class="sec-head">
          <div>
            <span class="eyebrow">Questions</span>
            <h2 style="margin-top: 16px;">The stuff owners ask <em>before sending their register.</em></h2>
          </div>
          <p v-if="whatsappDisplay">Don't see your question? Message us on WhatsApp at {{ whatsappDisplay }}. A person replies, not a bot.</p>
          <p v-else-if="email">Don't see your question? Email us at <a :href="`mailto:${email}`">{{ email }}</a>. A person replies, not a bot.</p>
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
            <span class="eyebrow" style="color: var(--paper-3);">Ready when you are</span>
            <h2 style="margin-top: 18px;">
              Send a photo today. <br>
              <em>Start collecting tomorrow.</em>
            </h2>
            <p>Click a few photos of your register, or send your Excel sheet, on WhatsApp. We set everything up and send you a login. You check it, and reminders start from the next morning.</p>
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
const { whatsappLink, whatsappDisplay, setupHref, email } = useSupport();

const setupMessage = "Hi MemberBook team, I want you to set up my register.\n\nBusiness name:\nType (gym / library / coaching):\nCity:\nNumber of members (approx):\n\nI'll send photos of the register / Excel sheet next.";
const setupLink = computed(() => setupHref(setupMessage));
const homeRef = ref<HTMLElement | null>(null);
const scrollRevealReady = ref(false);
let scrollRevealObserver: IntersectionObserver | undefined;

onMounted(async () => {
  const home = homeRef.value;
  if (!home) return;

  const revealTargets = home.querySelectorAll<HTMLElement>("[data-scroll-reveal]");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  revealTargets.forEach(target => scrollRevealObserver?.observe(target));
});

onBeforeUnmount(() => {
  scrollRevealObserver?.disconnect();
});

/* ── Inline warm icon set (line-style, currentColor) ───────────────── */
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
const IcBook = icon(() => [
  h("path", { d: "M5 5.5h8a4 4 0 0 1 4 4V20H9a4 4 0 0 0-4-4V5.5z" }),
  h("path", { d: "M17 9.5a4 4 0 0 1 4-4h-4M17 20h-4" }),
]);
const IcCap = icon(() => [
  h("path", { d: "m3 9 9-4 9 4-9 4-9-4z" }),
  h("path", { d: "M7 11.5v4c2.5 2 7.5 2 10 0v-4" }),
  h("path", { d: "M20 10v5" }),
]);
const IcBell = icon(() => [
  h("path", { d: "M6 9a6 6 0 0 1 12 0c0 4 1.5 6 1.5 6h-15S6 13 6 9z" }),
  h("path", { d: "M10 18.5a2 2 0 0 0 4 0" }),
]);
const IcCheck = icon(() => [h("path", { d: "M5 12.5 10 17 19 7" })], "0 0 24 24", 3);
const IcCheckCircle = icon(() => [h("circle", { cx: 12, cy: 12, r: 9 }), h("path", { d: "M8 12.5 10.5 15 16 9.5" })]);
const IcWhatsapp: FunctionalComponent<IconProps> = (p) =>
  h("svg", { width: p.size ?? 18, height: p.size ?? 18, viewBox: "0 0 24 24", fill: p.color ?? "currentColor" }, [
    h("path", { d: "M19.05 4.91A10 10 0 0 0 2.05 14.83l-1.4 5.16 5.28-1.39A10 10 0 1 0 19.05 4.9zm-7.04 15.37a8 8 0 0 1-4.06-1.11l-.29-.17-3.13.82.83-3.05-.19-.31a8 8 0 1 1 6.84 3.82zm4.39-6c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1-.37-1.92-1.18-.71-.63-1.18-1.41-1.32-1.65-.14-.24-.02-.37.1-.49.1-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.18 1.1.16 1.52.1.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z" }),
  ]);
const IcPhone = icon(() => [h("path", { d: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z" })]);

/* ── WhatsApp mock component ──────────────────────────── */
const WhatsAppMock: FunctionalComponent = () =>
  h("div", { class: "phone" }, [
    h("div", { class: "phone-screen", style: { background: "#ECE5DD" } }, [
      h("div", { class: "phone-notch" }),
      h("div", { style: { paddingTop: "50px", background: "#075E54", color: "white", padding: "50px 14px 12px", display: "flex", alignItems: "center", gap: "10px" } }, [
        h("svg", { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "white", "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round" }, [h("path", { d: "m15 18-6-6 6-6" })]),
        h("div", { style: { width: "32px", height: "32px", borderRadius: "99px", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: "13px" } }, "IF"),
        h("div", { style: { flex: 1 } }, [
          h("div", { style: { fontWeight: 600, fontSize: "13.5px" } }, "Iron Forge Gym"),
          h("div", { style: { fontSize: "10.5px", opacity: ".8" } }, "Business account · online"),
        ]),
        h(IcPhone, { size: 16, color: "white" }),
      ]),
      h("div", { class: "wa-screen" }, [
        h("div", { class: "wa-day" }, "TODAY"),
        h("div", { class: "wa-bubble" }, [
          h("strong", "Hi Priya! 👋"), h("br"),
          "Your ", h("strong", "Cardio Quarterly"), " plan at Iron Forge Gym is ending on ", h("strong", "04 Jan"), ".",
          h("div", { class: "meta" }, "9:01 AM"),
        ]),
        h("div", { class: "wa-bubble" }, [
          "Renew now and keep your streak going. Pay ₹3,000 by UPI and reply here once done.",
          h("div", { style: { marginTop: "8px", padding: "8px 10px", background: "#FBF7F0", border: "1px solid #00000010", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px" } }, [
            h("div", { style: { width: "28px", height: "28px", borderRadius: "8px", background: "#D9663D", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "12px", fontWeight: 700 } }, "₹"),
            h("div", { style: { flex: 1 } }, [
              h("div", { style: { fontSize: "12px", fontWeight: 600, color: "#221A14" } }, "UPI: ironforge@okaxis"),
              h("div", { style: { fontSize: "10px", color: "#5A4B40" } }, "GPay · PhonePe · Paytm · any UPI app"),
            ]),
            h("svg", { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "#221A14", "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round" }, [h("path", { d: "M5 12h14M13 6l6 6-6 6" })]),
          ]),
          h("div", { class: "meta" }, "9:01 AM"),
        ]),
        h("div", { class: "wa-bubble out" }, ["Just paid 🙌 see you at 6pm!", h("div", { class: "meta" }, "9:18 AM ✓✓")]),
        h("div", { class: "wa-bubble" }, [
          h("strong", "Payment received ✅"), h("br"),
          h("span", { style: { fontSize: "12px" } }, "₹3,000 · Cardio Quarterly · valid till 04 Apr 2026."), h("br"),
          h("span", { style: { fontSize: "11.5px", color: "#5a5a5a" } }, "Thank you, see you at the gym!"),
          h("div", { class: "meta" }, "9:18 AM"),
        ]),
      ]),
    ]),
  ]);

/* ── Static section data ───────────────────────────────────────────── */
const storySlides = [
  {
    id: "gym",
    label: "Gym",
    title: "Open the day knowing which renewals need action.",
    description: "A gym owner sees active members, pending dues, expiring plans, and WhatsApp reminders before the front desk gets crowded.",
    tone: "indigo" as const,
    primaryAction: { label: "See gym workflow", to: "/gym" },
    metrics: [
      { label: "Collected", value: "₹1.84L", delta: "+18% month" },
      { label: "Pending", value: "23", delta: "4 recovered" },
      { label: "Expiring", value: "12", delta: "this week" },
    ],
    previewRows: [
      { name: "Priya Sharma", detail: "Cardio Quarterly ends tomorrow", status: "Remind", amount: "₹3,000" },
      { name: "Aman Verma", detail: "Monthly all access unpaid", status: "Due", amount: "₹1,200" },
      { name: "Rohan Mehta", detail: "Annual plan active", status: "Paid", amount: "₹12,000" },
    ],
    message: "12 renewal reminders ready for 10:30 AM.",
  },
  {
    id: "library",
    label: "Library",
    title: "Seats, shifts, and fees stay visible from one screen.",
    description: "Track students by seat, plan, and renewal date without running a separate register for every shift.",
    tone: "green" as const,
    primaryAction: { label: "See library workflow", to: "/library" },
    metrics: [
      { label: "Seats filled", value: "38/50", delta: "76% full" },
      { label: "Collected", value: "₹82k", delta: "May fees" },
      { label: "Renewals", value: "9", delta: "next 7 days" },
    ],
    previewRows: [
      { name: "Rahul Sharma", detail: "Morning shift, Seat A14", status: "Active", amount: "₹1,800" },
      { name: "Priya Singh", detail: "Full day plan expires soon", status: "Remind", amount: "₹3,500" },
      { name: "Amit Kumar", detail: "Evening shift payment pending", status: "Due", amount: "₹1,500" },
    ],
    message: "Quiet reminder drafted for 9 library students.",
  },
  {
    id: "tuition",
    label: "Tuition",
    title: "Parents get fee reminders before your evening batch starts.",
    description: "Batch-wise fees, partial payments, and parent WhatsApp follow-ups are kept together so staff can close dues quickly.",
    tone: "amber" as const,
    primaryAction: { label: "See tuition workflow", to: "/tuition" },
    metrics: [
      { label: "Collected", value: "₹70k", delta: "this month" },
      { label: "Pending", value: "₹8.5k", delta: "5 students" },
      { label: "Batches", value: "6", delta: "active" },
    ],
    previewRows: [
      { name: "Class 10 Maths", detail: "April fees, 2 pending", status: "Follow up", amount: "₹5,000" },
      { name: "JEE Foundation", detail: "Partial payment recorded", status: "Partial", amount: "₹2,500" },
      { name: "Class 8 Science", detail: "All students paid", status: "Clear", amount: "₹0 due" },
    ],
    message: "5 parent reminders prepared with UPI details.",
  },
];

const setupSteps = [
  {
    icon: IcPhone,
    title: "Send us your register",
    text: "Click photos of your register pages, or send your Excel or Google Sheet, on WhatsApp. Messy handwriting is fine.",
    sample: "2 minutes of your time",
    meta: "Photos, Excel, CSV, or a typed list",
  },
  {
    icon: IcUsers,
    title: "We set everything up",
    text: "We type in every member, plan, fee and due date, add your UPI ID, and write reminder messages in your language. You get a login to check it.",
    sample: "Usually ready in 1 working day",
    meta: "Free, and you can correct anything",
  },
  {
    icon: IcRupee,
    title: "Reminders go out, you get paid",
    text: "Members get a WhatsApp reminder before their plan ends. Each morning you see who is due, who paid, and who still owes.",
    sample: "Mark paid in one tap",
    meta: "Cash or UPI, both tracked",
  },
];

const compareRows = [
  { before: "Flip through the register to find whose month is over", after: "Open your phone and see today's renewals in one list" },
  { before: "Message each member one by one, if you remember", after: "Reminders are ready for every due member, with amount and UPI ID" },
  { before: "\"I paid last week\" with no record to check", after: "Every payment, cash or UPI, saved against the member" },
  { before: "No idea how much is still pending this month", after: "Pending dues and collections totalled for you" },
  { before: "Hours of typing before any app is useful", after: "We type it all in. You start with a full book" },
];

const waRows = [
  { icon: IcBell, t: "Before the plan ends", d: "A friendly nudge a few days before expiry, and another on the due date." },
  { icon: IcWhatsapp, iconColor: "#25D366", t: "Your name, your words", d: "We write the message with you, in Hindi, English or Hinglish. No \"Dear customer\"." },
  { icon: IcRupee, t: "Amount and UPI ID inside", d: "Members pay from GPay, PhonePe or Paytm straight away, and you mark it paid." },
];

const audienceRows = [
  { icon: IcUsers, title: "Gyms", to: "/gym", text: "Monthly, quarterly and annual plans, renewal reminders, and a clear list of who has not paid." },
  { icon: IcBook, title: "Libraries", to: "/library", text: "Seats, shifts and monthly fees, with quiet WhatsApp reminders before dues pile up." },
  { icon: IcCap, title: "Coaching centres", to: "/tuition", text: "Batches, fee cycles, part payments and parent reminders in one place." },
];

/* ── Pricing ──────────────────────────────────────────────────────────
 * Edit this one array to change the pricing section. Plans with
 * cta.whatsapp open a WhatsApp chat with that pre-filled message.
 */
type PricingPlan = {
  name: string;
  blurb: string;
  price: string;
  priceUnit?: string;
  priceSmall?: boolean;
  featured?: boolean;
  ribbon?: string;
  features: string[];
  cta: { label: string; track: string; to?: string; whatsapp?: string };
};

const pricingNote = "The software is free, and so is setting it up for you. No card, no contract, no hidden charges. If we ever add paid extras, like building a website for your business, they will be optional and clearly priced.";

const pricingPlans: PricingPlan[] = [
  {
    name: "Do it yourself",
    blurb: "For owners who prefer to type members in themselves.",
    price: "₹0",
    priceUnit: "/month",
    features: ["Members, plans and payments", "One-tap WhatsApp reminders", "Import from Excel or CSV", "Phone and computer"],
    cta: { label: "Create free account", track: "home_pricing_self_serve", to: "/register" },
  },
  {
    name: "Done for you",
    blurb: "We load your register and set up reminders for you.",
    price: "₹0",
    priceUnit: "/month, setup included",
    featured: true,
    ribbon: "Recommended",
    features: [
      "We enter every member from photos or Excel",
      "Plans, fees and due dates set up",
      "Reminder messages in your language",
      "Your UPI ID in every reminder",
      "WhatsApp support from a real person",
    ],
    cta: { label: "Send us your register", track: "home_pricing_done_for_you", whatsapp: setupMessage },
  },
  {
    name: "Many branches",
    blurb: "Two or more gyms, libraries or centres.",
    price: "₹0",
    priceUnit: "/month",
    features: ["Every branch set up for you", "Branch-wise collections", "Staff logins per branch", "Priority WhatsApp support"],
    cta: { label: "Message us", track: "home_pricing_branches", whatsapp: "Hi MemberBook team, I run more than one branch and want to know more.\n\n" },
  },
];

const faqs: { question: string; answer: string }[] = [
  { question: "What exactly do you do for me?", answer: "You send photos of your member register or your Excel sheet on WhatsApp. We type every member, plan, fee and due date into MemberBook, add your UPI ID, write your reminder messages, and send you a login. You check it and tell us anything to fix." },
  { question: "How long does setup take?", answer: "Usually one working day after we receive your register. Very large registers can take a little longer, and we will tell you upfront." },
  { question: "What does it cost?", answer: "Nothing. MemberBook is free to use, and we set it up for you for free. There is no card and no contract. If we add paid extras later, such as building a website for your business, they will be optional." },
  { question: "Do reminders go from my own WhatsApp number?", answer: "Yes. Members see your name and number, and reply to you directly. Each reminder already has the member's name, amount and your UPI ID filled in." },
  { question: "Do my members need to install anything?", answer: "No. They only get WhatsApp messages. The app is for you and your staff, and works on any phone or computer." },
  { question: "Can I take cash and UPI payments?", answer: "Yes. Mark a cash or UPI payment in one tap and it is saved against the member, so you always know who paid and when." },
  { question: "Does it work in Hindi?", answer: "The app is in English, but your reminder messages and plan names can be in Hindi, Marathi, Tamil, Hinglish or any language you like." },
  { question: "Is my data safe?", answer: "Your data is stored on Cloudflare's servers, only you and the staff you add can see it, and we never share or sell your members' phone numbers. You can export everything to Excel any time." },
];

/* ── SEO ────────────────────────────────────────────────────────────── */
const seoTitle = "Gym, Library & Coaching Fee Reminders, Set Up for You | MemberBook";
const seoDescription = "Free software for Indian gyms, libraries and coaching centres. Send us your member register and we set it up for free: every member, plan and due date, plus WhatsApp renewal reminders with your UPI ID.";

useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  ogTitle: seoTitle,
  ogDescription: seoDescription,
  ogImage: `${appUrl}/og-image.png`,
  ogUrl: appUrl,
  ogType: "website",
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
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR", "description": "Free software with free setup" },
        "description": seoDescription,
      }),
    },
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Service",
        "name": "Done-for-you member register setup",
        "serviceType": "Membership and fee reminder setup",
        "provider": { "@type": "Organization", "name": "MemberBook", "url": appUrl },
        "areaServed": { "@type": "Country", "name": "India" },
        "audience": { "@type": "BusinessAudience", "audienceType": "Gyms, libraries and coaching centres" },
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR", "description": "Free setup" },
        "description": "We enter your members, plans and due dates from photos or Excel and set up WhatsApp renewal reminders with your UPI ID.",
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
        "description": "Done-for-you member and fee reminder setup for Indian gyms, libraries and coaching centres",
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
