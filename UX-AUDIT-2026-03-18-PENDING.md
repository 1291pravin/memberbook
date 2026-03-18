# MemberBook UX Audit - Pending Items

**Date:** 2026-03-18
**Source:** Follow-up to UX-AUDIT-2026-03-16.md
**Purpose:** Track unresolved issues and strategic recommendations not yet implemented

---

## Status of Original 14 Issues

| # | Issue | Status | Notes |
|---|-------|--------|-------|
| 1 | No "Aha Moment" after first member | DONE | Celebration screen with next steps |
| 2 | Empty dashboard feels dead | DONE | Motivational checklist copy added |
| 3 | Add member form overwhelming | DONE | Collapsible "More Details" already existed |
| 4 | Progress bar bug (3/4 on completion) | DONE | Auto-completes dashboardTour on wizard finish |
| 5 | "Library Seats" for gym business type | DONE | Dynamic title + gender filter hidden for non-library |
| 6 | Too many sidebar items | DONE | Progressive disclosure: shows 5 core items for new orgs, unlocks all at 5+ members |
| 7 | No onboarding email/welcome sequence | PENDING | Requires email infrastructure |
| 8 | No sample/demo data option | PENDING | Requires backend + design work |
| 9 | Phone number not formatted | DONE | formatPhone() added, used in member detail |
| 10 | Charts with zero data | DONE | Verified hasData checks already working |
| 11 | Onboarding step numbering unclear | DONE | Shows "Step X of Y: Label" format |
| 12 | Record Payment checkbox easy to miss | DONE | Auto-checks when plan selected (already worked) |
| 13 | No contextual help or tooltips | DONE | AppHelpIcon component + tooltips on Grace Period, Batch/Timing, Duration Type, Time/Gender Preference |
| 14 | No Record Payment on payments page | DONE | Button + modal with member search added |

---

## Strategic Recommendations - Status

| Recommendation | Status | Notes |
|----------------|--------|-------|
| Activation Loop | DONE | Celebration screen shows "Add Member #2" as primary CTA with progress messaging |
| Show Value Immediately | DONE | After first member with subscription, shows expiry reminder preview |
| Bulk Import Prominence | DONE | Onboarding wizard completion shows import option; members page auto-opens import modal via ?import=1 |
| Owner WhatsApp Re-engagement | PENDING | Requires scheduled jobs infrastructure |

---

## Remaining Pending Issues

### P1: Welcome Email Sequence (#7)
**Problem:** No re-engagement channel after user registers and leaves.
**Suggested sequence:**
- Immediately: Welcome email with quick-start guide
- Day 1: "You added X members! Here's how to add the rest"
- Day 3: "Did you know you can send WhatsApp payment reminders?"
- Day 7: "X member payments are pending - log in to record them"
**Effort:** Large - requires email provider integration (Resend, SendGrid, etc.), scheduled jobs, email templates
**Depends on:** Choosing an email provider, CRON/scheduled task infrastructure on Cloudflare Workers

### P1: Sample/Demo Data (#8)
**Problem:** Empty pages everywhere make it hard to evaluate the product.
**Suggested approach:**
- "Load sample data" button on empty dashboard
- Creates 15-20 fake members, plans, subscriptions, payments
- Clearly labeled as demo data with a "Clear demo data" option
- Alternative: Interactive product tour overlay showing what populated screens look like
**Effort:** Medium - backend seed script + frontend toggle
**Depends on:** Decision on approach (real fake data vs. overlay tour)

### P2: Owner WhatsApp Re-engagement
**Problem:** No way to bring back inactive gym owners.
**Suggested approach:**
- Send periodic WhatsApp nudges: "3 members expiring this week"
- Requires scheduled task infrastructure on Cloudflare Workers
**Effort:** Large
**Depends on:** CRON infrastructure, WhatsApp integration for owner messages

---

## Prioritized Remaining Backlog

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| P1 | Welcome email sequence | Large | High - re-engages churned users |
| P1 | Sample/demo data | Medium | High - helps evaluation |
| P2 | Owner WhatsApp re-engagement | Large | High - drives retention |
