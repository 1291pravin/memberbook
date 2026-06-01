<template>
  <div ref="homeRef" class="mb" :class="{ 'scroll-reveal-ready': scrollRevealReady }">
    <!-- ───────────────────────── Hero ───────────────────────── -->
    <section class="hero">
      <div class="wrap">
        <div class="hero-layout-split">
          <div class="hero-copy">
            <span class="eyebrow">For Indian membership businesses</span>
            <h1 style="margin-top: 22px;">
              Run memberships without the
              <span class="strike">paper chase</span>.
            </h1>
            <p class="hero-sub">Members, fees, renewals, and WhatsApp reminders in one friendly app for gyms, libraries, and tuition centers.</p>
            <div class="hero-ctas">
              <NuxtLink to="/register" class="btn btn-accent" @click="trackCtaClick('home_hero_start_free')">
                Start free for 14 days <IcArrow :size="14" />
              </NuxtLink>
              <NuxtLink to="/features" class="btn btn-ghost" @click="trackCtaClick('home_hero_tour')">
                See how it works
              </NuxtLink>
            </div>
            <div class="hero-note">
              <span style="display: inline-flex; align-items: center; gap: 6px;">
                <span class="check"><IcCheck :size="9" /></span> No credit card
              </span>
              <span style="display: inline-flex; align-items: center; gap: 6px;">
                <span class="check"><IcCheck :size="9" /></span> Hindi / English
              </span>
              <span style="display: inline-flex; align-items: center; gap: 6px;">
                <span class="check"><IcCheck :size="9" /></span> Works on any phone
              </span>
            </div>
            <p style="margin-top: 18px; font-size: 13px; color: var(--ink-3);">
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
                <div style="font-weight: 600;">12 reminders sent</div>
                <div class="small">Today &middot; auto-scheduled</div>
              </div>
            </div>
          </div>
        </div>

        <div class="proof-row">
          <span class="label">Trusted by membership businesses across India</span>
          <div class="proof-logos">
            <span>Iron Forge</span>
            <span style="font-family: var(--font-mono); font-size: 14px;">CITY/STUDY</span>
            <span style="font-style: italic;">BrightPath Tuition</span>
            <span>BEAST&nbsp;HOUSE</span>
            <span style="font-family: var(--font-mono); font-size: 14px;">bookstack.in</span>
            <span>Flex Studio</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ───────────────────── Features ───────────────────── -->
    <section class="section story-section">
      <div class="wrap" data-scroll-reveal>
        <MarketingStorySlider :slides="storySlides" />
      </div>
    </section>

    <section id="features" class="section" style="background: var(--paper);">
      <div class="wrap" data-scroll-reveal>
        <div class="sec-head">
          <div>
            <span class="eyebrow">Built for the day-to-day</span>
            <h2 style="margin-top: 16px;">The four jobs your front desk repeats every day.</h2>
          </div>
          <p>No 12-tab cockpit. MemberBook keeps the daily loop tight: add the person, collect the fee, send the reminder, and know what needs attention tomorrow.</p>
        </div>

        <div class="workflow-grid">
          <article v-for="(item, index) in workflowCards" :key="item.title" class="workflow-card">
            <span class="workflow-card__step">{{ String(index + 1).padStart(2, "0") }}</span>
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

        <div v-if="false" class="feature-grid feature-grid--legacy">
          <!-- Add member -->
          <div class="f-card tall">
            <div class="ic-wrap"><IcPlus :size="20" /></div>
            <div>
              <h3>Add a member in 10 seconds</h3>
              <p>Name, phone, plan — done. MemberBook handles dates, dues, and reminders for you. No spreadsheets, no double-entry.</p>
            </div>
            <div class="visual">
              <div style="background: var(--paper-2); border: 1px solid var(--border); border-radius: 14px; padding: 18px; display: flex; flex-direction: column; gap: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div style="font-family: var(--font-heading); font-size: 16px; font-weight: 600;">Add member</div>
                  <div style="font-size: 11px; color: var(--ink-3); font-family: var(--font-mono); letter-spacing: .06em;">STEP 1 OF 2</div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                  <div style="padding: 8px 10px; background: var(--paper); border: 1px solid var(--border); border-radius: 8px; font-size: 12px;">
                    <div style="font-size: 10px; color: var(--ink-3);">NAME</div>
                    <div style="font-weight: 600;">Rohan Mehta<span style="display: inline-block; width: 1px; height: 14px; background: var(--accent); margin-left: 2px; vertical-align: middle; animation: blink 1s infinite;"/></div>
                  </div>
                  <div style="padding: 8px 10px; background: var(--paper); border: 1px solid var(--border); border-radius: 8px; font-size: 12px;">
                    <div style="font-size: 10px; color: var(--ink-3);">PHONE</div>
                    <div style="font-weight: 600;">+91 98765 43210</div>
                  </div>
                </div>
                <div style="padding: 8px 10px; background: var(--paper); border: 1px solid var(--border); border-radius: 8px; font-size: 12px; display: flex; justify-content: space-between; align-items: center;">
                  <span><span style="font-size: 10px; color: var(--ink-3); margin-right: 6px;">PLAN</span><span style="font-weight: 600;">Annual &middot; Strength + Cardio</span></span>
                  <span style="font-family: var(--font-heading); font-size: 14px; font-weight: 600; color: var(--accent);">&#8377;12,000</span>
                </div>
                <div style="display: flex; gap: 6px; align-items: center; padding: 8px 10px; background: var(--positive-soft); color: color-mix(in oklab, var(--positive) 80%, var(--ink)); border-radius: 8px; font-size: 11.5px; font-weight: 600;">
                  <IcCheckCircle :size="13" /> Saved in 8 seconds
                </div>
              </div>
            </div>
          </div>

          <!-- Plans -->
          <div class="f-card wide">
            <div class="ic-wrap"><IcTag :size="20" /></div>
            <div>
              <h3>Plans that match your business</h3>
              <p>Monthly, quarterly, annual, batch-wise, seat-wise. Make any plan in seconds, change it later if it does not work.</p>
            </div>
            <div class="visual">
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
                <div v-for="p in planVisuals" :key="p.name" :style="{ padding: '14px 12px', background: p.color, color: p.text || 'var(--ink)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }">
                  <div style="font-size: 10px; font-family: var(--font-mono); letter-spacing: .1em; text-transform: uppercase; opacity: .7;">{{ p.name }}</div>
                  <div style="font-family: var(--font-heading); font-size: 22px; font-weight: 600; letter-spacing: -0.02em;">{{ p.price }}</div>
                  <div style="font-size: 10.5px; opacity: .7;">Strength + Cardio</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Reminders -->
          <div class="f-card third">
            <div class="ic-wrap"><IcBell :size="20" /></div>
            <div>
              <h3>Auto-reminders, your tone</h3>
              <p>MemberBook nudges members 7 / 3 / 0 days before expiry on WhatsApp — in your voice, not a robot's.</p>
            </div>
            <div class="visual">
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <div v-for="r in reminderRows" :key="r.action" style="display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--paper-2); border-radius: 10px; border: 1px solid var(--border);">
                  <div :style="{ width: '8px', height: '8px', borderRadius: '99px', background: r.color, flexShrink: 0 }"/>
                  <div style="flex: 1;">
                    <div style="font-size: 13px; font-weight: 600;">{{ r.action }}</div>
                    <div style="font-size: 11px; color: var(--ink-3);">{{ r.day }} &middot; WhatsApp</div>
                  </div>
                  <div style="font-family: var(--font-mono); font-size: 11px; color: var(--ink-2);">{{ r.time }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Payments -->
          <div class="f-card third">
            <div class="ic-wrap"><IcRupee :size="20" /></div>
            <div>
              <h3>Cash or UPI, both work</h3>
              <p>Record offline payments in two taps. Send a pay link on WhatsApp for the rest. Receipts go out automatically.</p>
            </div>
            <div class="visual" style="padding: 14px; background: var(--paper-2); border-radius: 12px; display: flex; flex-direction: column; gap: 8px;">
              <div style="display: flex; gap: 8px;">
                <div style="flex: 1; padding: 10px; background: var(--paper); border: 1px solid var(--border); border-radius: 9px; font-size: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px;">
                  &#128181; Cash
                </div>
                <div style="flex: 1; padding: 10px; background: var(--ink); color: var(--paper); border-radius: 9px; font-size: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px;">
                  <IcRupee :size="13" /> UPI link
                </div>
              </div>
              <div style="padding: 8px 10px; background: var(--paper); border: 1px solid var(--border); border-radius: 8px; display: flex; align-items: center; gap: 8px; font-size: 11.5px;">
                <IcCheckCircle :size="13" color="var(--positive)" />
                <span style="font-weight: 600;">&#8377;3,000 received</span>
                <span style="color: var(--ink-3); margin-left: auto; font-family: var(--font-mono); font-size: 10px;">2 sec ago</span>
              </div>
            </div>
          </div>

          <!-- Revenue -->
          <div class="f-card third">
            <div class="ic-wrap"><IcChart :size="20" /></div>
            <div>
              <h3>See your business at a glance</h3>
              <p>Revenue, renewals, who's coming back, who's drifting away. Real numbers, no Excel required.</p>
            </div>
            <div class="visual">
              <div style="display: flex; flex-direction: column; gap: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-size: 11px; color: var(--ink-3); font-family: var(--font-mono); letter-spacing: .1em; text-transform: uppercase;">This year</div>
                    <div style="font-family: var(--font-heading); font-size: 28px; font-weight: 600; letter-spacing: -0.02em;">&#8377;18.4L</div>
                  </div>
                  <div style="font-size: 12px; color: var(--positive); font-weight: 600;">&#9650; 34% YoY</div>
                </div>
                <div style="display: flex; gap: 4px; align-items: flex-end; height: 70px;">
                  <div v-for="(v, i) in revenueBars" :key="i" :style="{ flex: 1, height: ((v / revenueMax) * 100) + '%', background: i === revenueBars.length - 1 ? 'var(--accent)' : 'var(--paper-3)', borderRadius: '3px' }"/>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--ink-3); font-family: var(--font-mono); letter-spacing: .05em;">
                  <span>JAN</span><span>APR</span><span>JUL</span><span>OCT</span><span>DEC</span>
                </div>
              </div>
            </div>
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
              MemberBook keeps the app simple, then changes the words around your business: plans for gyms,
              seats for libraries, batches for tuition centers.
            </p>
            <div class="audience-list">
              <div v-for="row in audienceRows" :key="row.title" class="audience-row">
                <div class="audience-icon">
                  <component :is="row.icon" :size="17" />
                </div>
                <div>
                  <h3>{{ row.title }}</h3>
                  <p>{{ row.text }}</p>
                </div>
              </div>
            </div>
          </div>
          <figure class="audience-art">
            <img
              src="/brand/membership-verticals.webp"
              alt="Gym, library, and tuition center counters using MemberBook on phones"
              width="1200"
              height="1200"
              loading="lazy"
            >
            <figcaption>Gym renewals, library seats, tuition fee reminders, all sharing the same simple flow.</figcaption>
          </figure>
        </div>
      </div>
    </section>

    <!-- ───────────────────── WhatsApp ───────────────────── -->
    <section id="whatsapp" class="section" style="background: var(--paper-2);">
      <div class="wrap" data-scroll-reveal>
        <div class="wa-grid">
          <div>
            <span class="eyebrow"><IcWhatsapp :size="11" color="currentColor" /> WhatsApp built in</span>
            <h2 style="margin-top: 16px; font-size: var(--fs-h2); color: var(--ink);">
              Members already live on WhatsApp.<br>
              <em style="font-style: italic; color: var(--accent); font-family: var(--font-heading); font-weight: 500;">Meet them there.</em>
            </h2>
            <p style="color: var(--ink-2); font-size: var(--fs-lead); max-width: 42ch; margin-top: 20px;">
              Renewal nudges, payment links, receipts — sent from your gym's WhatsApp number, in Hindi or English. Members reply, you reply back. That's it.
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

            <div style="margin-top: 32px; padding: 20px 22px; background: var(--paper); border: 1px solid var(--border); border-radius: 16px; display: flex; align-items: center; gap: 20px;">
              <div>
                <div style="font-family: var(--font-heading); font-size: 36px; font-weight: 600; color: var(--accent); letter-spacing: -0.02em; line-height: 1;">&#8593; 41%</div>
                <div style="font-size: 12px; color: var(--ink-3); margin-top: 4px;">on-time renewals after switching</div>
              </div>
              <div style="width: 1px; align-self: stretch; background: var(--border);"/>
              <div>
                <div style="font-family: var(--font-heading); font-size: 36px; font-weight: 600; color: var(--accent); letter-spacing: -0.02em; line-height: 1;">3.4 hrs</div>
                <div style="font-size: 12px; color: var(--ink-3); margin-top: 4px;">average time saved per week</div>
              </div>
            </div>
          </div>

          <div style="position: relative; display: flex; justify-content: center;">
            <WhatsAppMock />
            <div class="floater" style="top: 12%; right: -2%; transform: rotate(3deg);">
              <div class="ic" style="background: var(--positive-soft); color: var(--positive);"><IcCheckCircle :size="16" /></div>
              <div>
                <div style="font-weight: 600;">Renewed in 17 mins</div>
                <div class="small">No follow-up call needed</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ───────────────────── Big quote ───────────────────── -->
    <section class="section" style="padding-top: 0;">
      <div class="wrap">
        <div class="bigquote" data-scroll-reveal>
          <div class="qmark">&ldquo;</div>
          <div>
            <blockquote>
              I used to spend Sunday nights on a spreadsheet chasing 200 members.
              Now MemberBook just&hellip; handles it. My wife thinks I quit the gym business.
            </blockquote>
            <div class="who">
              <Avatar initials="VR" :idx="0" :size="44" />
              <div>
                <div class="name">Vikram Rajput</div>
                <div class="meta">Owner, Iron Forge Gym &middot; Pune &middot; 240 members</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ───────────────────── Testimonials ───────────────────── -->
    <section id="testimonials" class="section" style="background: var(--paper);">
      <div class="wrap" data-scroll-reveal>
        <div class="sec-head">
          <div>
            <span class="eyebrow">From owners like you</span>
            <h2 style="margin-top: 16px;">Gyms run quieter <em>since MemberBook.</em></h2>
          </div>
          <p>No paid case studies. Just practical operators who wanted fewer payment follow-ups and cleaner records.</p>
        </div>
        <div class="testi-carousel" aria-label="MemberBook owner stories">
          <button type="button" aria-label="Previous testimonial" class="testi-nav" @click="currentTestimonial = (currentTestimonial + testimonials.length - 1) % testimonials.length">
            &lt;
          </button>
          <div class="testi testi--featured">
            <div style="color: var(--accent); font-family: var(--font-heading); font-size: 32px; line-height: .6; font-weight: 500; font-style: italic;">&ldquo;</div>
            <p>{{ testimonials[currentTestimonial].q }}</p>
            <div class="who">
              <Avatar :initials="testimonials[currentTestimonial].av" :idx="testimonials[currentTestimonial].idx" :size="36" />
              <div>
                <div class="name">{{ testimonials[currentTestimonial].name }}</div>
                <div class="meta">{{ testimonials[currentTestimonial].meta }}</div>
              </div>
            </div>
          </div>
          <button type="button" aria-label="Next testimonial" class="testi-nav" @click="currentTestimonial = (currentTestimonial + 1) % testimonials.length">
            &gt;
          </button>
        </div>
        <div class="testi-dots" role="tablist" aria-label="Choose testimonial">
          <button
            v-for="(t, index) in testimonials"
            :key="t.name"
            type="button"
            :aria-label="`Show ${t.name}'s testimonial`"
            :aria-selected="index === currentTestimonial"
            @click="currentTestimonial = index"
          />
        </div>
      </div>
    </section>

    <!-- ───────────────────── Pricing ───────────────────── -->
    <section id="pricing" class="section" style="background: var(--paper-2);">
      <div class="wrap" data-scroll-reveal>
        <div class="sec-head">
          <div>
            <span class="eyebrow">Honest pricing</span>
            <h2 style="margin-top: 16px;">Start free. <em>Grow when you're ready.</em></h2>
          </div>
          <p>No card to start. Switch or cancel any time — your data exports to a clean CSV and we keep nothing.</p>
        </div>
        <div class="pricing">
          <div class="plan">
            <h3>Starter</h3>
            <p class="blurb">For new gyms finding their rhythm.</p>
            <div class="price">&#8377;0<small>/forever</small></div>
            <ul>
              <li>Up to 30 members</li>
              <li>One plan type</li>
              <li>WhatsApp reminders</li>
              <li>Mobile + web app</li>
            </ul>
            <NuxtLink to="/register" class="btn btn-ghost" style="margin-top: auto;" @click="trackCtaClick('home_pricing_starter')">Get started</NuxtLink>
          </div>
          <div class="plan featured">
            <span class="ribbon">Most popular</span>
            <h3>Growth</h3>
            <p class="blurb">For gyms running real numbers.</p>
            <div class="price">Free<small>to start</small></div>
            <ul>
              <li>Unlimited members &amp; plans</li>
              <li>Auto WhatsApp + receipts</li>
              <li>UPI / cash / card payments</li>
              <li>Reports &amp; exports</li>
              <li>Staff accounts</li>
            </ul>
            <NuxtLink to="/register" class="btn btn-accent" style="margin-top: auto;" @click="trackCtaClick('home_pricing_growth')">Start free</NuxtLink>
          </div>
          <div class="plan">
            <h3>Chain</h3>
            <p class="blurb">Two or more branches under one roof.</p>
            <div class="price" style="font-size: 34px;">Let's talk</div>
            <ul>
              <li>Multiple branches</li>
              <li>Branch-wise reports</li>
              <li>Shared member directory</li>
              <li>Priority WhatsApp support</li>
            </ul>
            <NuxtLink to="/contact" class="btn btn-ghost" style="margin-top: auto;" @click="trackCtaClick('home_pricing_chain')">Talk to us</NuxtLink>
          </div>
        </div>
        <p style="margin-top: 24px; font-size: 13px; color: var(--ink-3); text-align: center;">
          Not sure what your gym brings in?
          <NuxtLink to="/tools/gym-membership-revenue-calculator" style="color: var(--accent-2); text-decoration: underline; text-underline-offset: 2px;">Try the free revenue calculator.</NuxtLink>
        </p>
      </div>
    </section>

    <!-- ───────────────────── FAQ ───────────────────── -->
    <section id="faq" class="section" style="background: var(--paper);">
      <div class="wrap" data-scroll-reveal>
        <div class="sec-head">
          <div>
            <span class="eyebrow">Questions</span>
            <h2 style="margin-top: 16px;">The stuff owners ask <em>before signing up.</em></h2>
          </div>
          <p>Don't see your question? Ping us on WhatsApp at +91 91378 49812. A human replies — not a bot.</p>
        </div>
        <div class="faq-list">
          <div v-for="f in faqs" :key="f.question" class="faq-item">
            <h4>{{ f.question }}</h4>
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
              Get your Sundays back. <br>
              <em>Start free, no card.</em>
            </h2>
            <p>Set up takes 10 minutes. Import your members in another 20. By tomorrow morning, every renewal reminder for this week is already on its way.</p>
          </div>
          <div class="right">
            <div class="ctas">
              <NuxtLink to="/register" class="btn btn-accent" @click="trackCtaClick('home_cta_start_free')">Start free for 14 days <IcArrow :size="14" /></NuxtLink>
              <NuxtLink to="/contact" class="btn btn-ghost" @click="trackCtaClick('home_cta_demo')">Get setup help</NuxtLink>
            </div>
            <div class="stat" style="align-self: stretch;">
              <strong>1,800+</strong>
              <span>membership businesses across India run on MemberBook</span>
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
const appUrl = config.public.appUrl || "https://memberbook.app";
const { trackCtaClick } = useAnalytics();
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
const IcTag = icon((p) => [
  h("path", { d: "M3 12V4h8l10 10-8 8L3 12z" }),
  h("circle", { cx: 7, cy: 8, r: 1, fill: p.color ?? "currentColor" }),
]);
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
const IcChart = icon(() => [
  h("path", { d: "M4 19V5M4 19h16" }),
  h("path", { d: "M8 16V11M12 16V8M16 16V13" }),
]);
const IcPlus = icon(() => [h("path", { d: "M12 5v14M5 12h14" })]);
const IcArrow = icon(() => [h("path", { d: "M5 12h14M13 6l6 6-6 6" })]);
const IcCheck = icon(() => [h("path", { d: "M5 12.5 10 17 19 7" })], "0 0 24 24", 3);
const IcCheckCircle = icon(() => [h("circle", { cx: 12, cy: 12, r: 9 }), h("path", { d: "M8 12.5 10.5 15 16 9.5" })]);
const IcWhatsapp: FunctionalComponent<IconProps> = (p) =>
  h("svg", { width: p.size ?? 18, height: p.size ?? 18, viewBox: "0 0 24 24", fill: p.color ?? "currentColor" }, [
    h("path", { d: "M19.05 4.91A10 10 0 0 0 2.05 14.83l-1.4 5.16 5.28-1.39A10 10 0 1 0 19.05 4.9zm-7.04 15.37a8 8 0 0 1-4.06-1.11l-.29-.17-3.13.82.83-3.05-.19-.31a8 8 0 1 1 6.84 3.82zm4.39-6c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1-.37-1.92-1.18-.71-.63-1.18-1.41-1.32-1.65-.14-.24-.02-.37.1-.49.1-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.18 1.1.16 1.52.1.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z" }),
  ]);
const IcPhone = icon(() => [h("path", { d: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z" })]);

/* ── Avatar ───────────────────────────────── */
const AVATAR_COLORS = ["#D9663D", "#4F7A5A", "#7A5BA8", "#3C7DAA", "#C97A1B", "#B43E60", "#5A6B3A", "#2E7A6E"];
const Avatar: FunctionalComponent<{ initials: string; idx: number; size?: number }> = (p) => {
  const sz = p.size ?? 28;
  return h(
    "div",
    { class: "avatar", style: { background: AVATAR_COLORS[p.idx % AVATAR_COLORS.length], width: sz + "px", height: sz + "px", fontSize: sz * 0.4 + "px" } },
    p.initials,
  );
};

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
          "Renew now and keep your streak going. Tap below to pay ₹3,000 securely.",
          h("div", { style: { marginTop: "8px", padding: "8px 10px", background: "#FBF7F0", border: "1px solid #00000010", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px" } }, [
            h("div", { style: { width: "28px", height: "28px", borderRadius: "8px", background: "#D9663D", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "12px", fontWeight: 700 } }, "₹"),
            h("div", { style: { flex: 1 } }, [
              h("div", { style: { fontSize: "12px", fontWeight: 600, color: "#221A14" } }, "Pay ₹3,000"),
              h("div", { style: { fontSize: "10px", color: "#5A4B40" } }, "Secure UPI · GPay · Card"),
            ]),
            h("svg", { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "#221A14", "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round" }, [h("path", { d: "M5 12h14M13 6l6 6-6 6" })]),
          ]),
          h("div", { class: "meta" }, "9:01 AM"),
        ]),
        h("div", { class: "wa-bubble out" }, ["Just paid 🙌 see you at 6pm!", h("div", { class: "meta" }, "9:18 AM ✓✓")]),
        h("div", { class: "wa-bubble" }, [
          h("strong", "Payment received ✅"), h("br"),
          h("span", { style: { fontSize: "12px" } }, "₹3,000 · Cardio Quarterly · valid till 04 Apr 2026."), h("br"),
          h("span", { style: { fontSize: "11.5px", color: "#5a5a5a" } }, "Receipt: #MB-4811"),
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

const workflowCards = [
  { icon: IcPlus, title: "Add member", text: "Name, phone, plan, and start date. The rest of the record builds itself.", sample: "Saved in 8 seconds", meta: "No spreadsheet double-entry" },
  { icon: IcRupee, title: "Collect fees", text: "Record cash or UPI in two taps, then keep receipts and history attached to the member.", sample: "₹3,000 received", meta: "Cash, UPI, card, or partial" },
  { icon: IcWhatsapp, title: "Send reminder", text: "Use a clear WhatsApp message that sounds like your business, not a generic system.", sample: "12 reminders queued", meta: "7 days, 3 days, expiry day" },
  { icon: IcChart, title: "Know what needs attention", text: "See dues, renewals, active members, and collections before the day gets noisy.", sample: "23 pending payments", meta: "Prioritized for action" },
];

const planVisuals = [
  { name: "Monthly", price: "₹1,200", color: "var(--paper-3)", text: undefined as string | undefined },
  { name: "Quarterly", price: "₹3,000", color: "var(--accent-soft)", text: undefined as string | undefined },
  { name: "Annual", price: "₹12,000", color: "var(--ink)", text: "var(--paper)" },
];

const reminderRows = [
  { day: "7 days before", action: "Friendly nudge", time: "10:30 AM", color: "var(--positive)" },
  { day: "3 days before", action: "Final reminder", time: "10:30 AM", color: "var(--accent)" },
  { day: "On expiry", action: "Renewal offer", time: "09:00 AM", color: "var(--accent-2)" },
  { day: "+3 days", action: "Win-back", time: "06:00 PM", color: "var(--ink-3)" },
];

const revenueBars = [62, 78, 71, 92, 84, 110, 124, 118, 142, 156, 174, 184];
const revenueMax = Math.max(...revenueBars);

const waRows = [
  { icon: IcBell, t: "Smart timing", d: "7 days before, 3 days before, on expiry — only when it actually helps." },
  { icon: IcWhatsapp, iconColor: "#25D366", t: "Your name, your voice", d: "Templates you can edit. No 'Dear customer' nonsense." },
  { icon: IcRupee, t: "Pay link inside the chat", d: "UPI, GPay, PhonePe, card — receipt auto-sent on success." },
];

const audienceRows = [
  { icon: IcUsers, title: "Gyms", text: "Plans, attendance, renewal reminders, and UPI receipts without a messy front-desk register." },
  { icon: IcBook, title: "Libraries", text: "Seats, monthly fees, student lists, and quiet WhatsApp reminders before dues pile up." },
  { icon: IcCap, title: "Tuition centers", text: "Batches, fee cycles, parent reminders, and payment history in a flow your staff can learn fast." },
];

const testimonials = [
  { q: "Switched from a notebook. Took 30 mins to import 180 members. The WhatsApp reminders alone paid for the year in week 2.", name: "Arjun Khanna", meta: "Beast House Fitness, Indore", idx: 1, av: "AK" },
  { q: "My trainers love it because they can mark attendance from their phone. I love it because I can see revenue from my bed at 11pm.", name: "Sneha Iyer", meta: "Flex Studio, Bengaluru", idx: 3, av: "SI" },
  { q: "Support replies on WhatsApp like a friend would, not a ticket system. Solved my UPI issue in 4 minutes flat.", name: "Karan Patel", meta: "The Cage MMA, Ahmedabad", idx: 4, av: "KP" },
];
const currentTestimonial = ref(0);

const faqs: { question: string; answer: string }[] = [
  { question: "Will my old members import easily?", answer: "Yes. Send us your Excel, CSV, or even a photo of your notebook — we'll have you set up in under an hour. Free, no commitment." },
  { question: "Do my members need to install anything?", answer: "No. Everything they receive is on WhatsApp. The app is only for you and your staff." },
  { question: "Can I take cash and UPI payments?", answer: "Yes. Record cash payments in two taps, or send a UPI / GPay / card pay link on WhatsApp. Receipts go out automatically." },
  { question: "Can I print receipts and invoices?", answer: "Yes. Share a PDF receipt on WhatsApp, or print one — GST-ready if you need it." },
  { question: "Is my data safe?", answer: "Your data is encrypted with daily backups, and your members' phone numbers are never shared with anyone. Ever." },
  { question: "Does it work in Hindi?", answer: "The app is in English, but you can write your WhatsApp messages and plan names in Hindi, Marathi, Tamil — anything Unicode supports." },
];

/* ── SEO ────────────────────────────────────────────────────────────── */
useSeoMeta({
  title: "Gym, Library and Tuition Management Software India | MemberBook",
  description: "MemberBook is free member management software for Indian gyms, libraries, and tuition centers. Track members, collect payments, manage plans, and send WhatsApp renewal reminders.",
  ogTitle: "Gym, Library and Tuition Management Software India | MemberBook",
  ogDescription: "Track members, collect payments, manage plans, and send WhatsApp renewal reminders for Indian gyms, libraries, and tuition centers.",
  ogImage: `${appUrl}/og-image.png`,
  ogUrl: appUrl,
  ogType: "website",
  twitterCard: "summary_large_image",
  twitterTitle: "Gym, Library and Tuition Management Software India | MemberBook",
  twitterDescription: "Track members, collect payments, manage plans, and send WhatsApp renewal reminders for Indian gyms, libraries, and tuition centers.",
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
        "applicationCategory": "BusinessApplication",
        "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "ratingCount": "127" },
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR" },
        "operatingSystem": "Web Browser",
        "description": "Simple subscription and member management software for gyms, libraries, and tuition centers in India.",
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
        "logo": `${appUrl}/logo.svg`,
        "description": "Simple member management software for Indian small businesses",
        "address": { "@type": "PostalAddress", "addressCountry": "IN" },
        "areaServed": { "@type": "Country", "name": "India" },
      }),
    },
  ],
});
</script>
