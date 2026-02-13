# MemberBook Feature Roadmap 2026

**Last Updated:** 2026-02-12
**Document Owner:** Product Management
**Status:** Active

---

## Executive Summary

MemberBook is **80% ready for v1.0 launch**. The core foundation is solid with member management, subscriptions, payments, check-ins, and multi-tenancy all working well. However, two critical gaps block production readiness:

1. **Email Notifications** — Only WhatsApp exists; users expect email for professional communication
2. **Receipt/Invoice Generation** — No PDF receipts looks unprofessional and limits adoption

**Recommendation:** Focus on closing these gaps in the next 4 weeks, then launch v1.0 to first 50 paying customers.

---

## Current State Assessment

### ✅ What's Working Well

**Core Features Complete:**
- Member management (CRUD, profiles, search, filters)
- Subscription plans (flexible pricing, duration)
- Payment recording (cash, UPI, card, bank transfer)
- Inquiry pipeline (lead capture → member conversion)
- Check-in/checkout attendance tracking ✨ (recently shipped)
- Dashboard analytics (revenue, active members, expiring subscriptions)
- Staff management (owner/staff roles, permissions)

**Technical Foundation:**
- Multi-tenancy with full org isolation
- Modern stack: Nuxt 4 + Cloudflare Workers (fast, scalable, edge-deployed)
- Drizzle ORM with D1 (type-safe, zero-latency queries)
- Session-based auth + Google OAuth
- Responsive mobile-first UI with Tailwind CSS 4

**Market Fit:**
- WhatsApp-first messaging (native integration)
- CSV import for easy data migration
- INR/paise native (no currency conversion issues)
- UPI payment method support
- Multi-vertical (gyms, libraries, tuition centers)

### ❌ Critical Gaps for Production

1. **Email Notifications** — Payment reminders, expiry alerts, welcome emails
2. **Receipt Generation** — PDF receipts with org logo, GST details
3. **Bulk Operations** — No way to send reminders or update status for multiple members
4. **Advanced Reporting** — Limited exports, no monthly summaries

---

## Feature Prioritization (RICE Framework)

**RICE Scoring Formula:**
- **Reach:** How many users benefit (1-10 scale)
- **Impact:** How much it helps (1=low, 3=high)
- **Confidence:** How certain are we (0.1-1.0)
- **Effort:** Person-days to build

**Score = (Reach × Impact × Confidence) / Effort**

---

## Top 10 Features (Ranked by RICE)

| Rank | Feature | Reach | Impact | Confidence | Effort | RICE | Priority |
|------|---------|-------|--------|------------|--------|------|----------|
| 1 | Email Notifications | 100 | 3 | 1.0 | 9 | **101** | P0 🔥 |
| 2 | Receipt/Invoice Generation | 90 | 3 | 0.9 | 7 | **73** | P0 🔥 |
| 3 | Bulk Operations | 80 | 2 | 1.0 | 6.5 | **69** | P1 |
| 4 | Late Fee Automation | 40 | 3 | 0.8 | 5.5 | **38** | P1 |
| 5 | Attendance Analytics | 70 | 2 | 0.9 | 6 | **35** | P1 |
| 6 | Advanced Reporting | 85 | 2 | 0.8 | 9 | **34** | P1 |
| 7 | Payment Gateway (Razorpay) | 70 | 3 | 0.6 | 16 | **25** | P2 |
| 8 | Member Self-Service Portal | 60 | 2 | 0.8 | 13 | **23** | P2 |
| 9 | Batch Management (Tuition) | 35 | 3 | 0.9 | 11 | **21** | P1 |
| 10 | Mobile App (iOS/Android) | 80 | 2 | 0.5 | 30+ | **16** | P3 |

---

## Phase 1: v1.0 Launch Prep (4 Weeks)

**Goal:** Make MemberBook production-ready for first 50 paying customers

### Feature #1: Email Notifications (RICE: 101)
**Effort:** 8-10 days
**Priority:** P0 🔥

**What:**
- Integrate email service (Resend recommended for Cloudflare)
- Create email templates (payment reminders, expiry alerts, welcome, receipt)
- Add email preferences to org settings (email only, WhatsApp only, or both)
- Build email queue/scheduling system
- Admin UI to preview and test emails

**User Stories:**
- As a gym owner, I want to send email payment reminders to members whose subscriptions expire in 7 days
- As a librarian, I want to send welcome emails to new members with their membership ID
- As a tuition center operator, I want members to receive email receipts after payment
- As an admin, I want to choose between email and WhatsApp for each notification type

**Technical Notes:**
- Use Resend.com (official Cloudflare Workers integration)
- Store email templates in database (editable per org)
- Queue system with retry logic (Cloudflare Queues or D1 + cron)
- Track email delivery status (sent, delivered, bounced, opened)

**Acceptance Criteria:**
- [ ] Email service integrated and tested
- [ ] 5 core email templates (welcome, payment reminder, expiry alert, receipt, payment confirmation)
- [ ] Email preferences in org settings
- [ ] Email queue with retry logic
- [ ] Email delivery tracking dashboard

---

### Feature #2: Receipt/Invoice Generation (RICE: 73)
**Effort:** 6-8 days
**Priority:** P0 🔥

**What:**
- Add PDF generation library (PDFKit or Puppeteer)
- Create receipt template (org logo, GST optional, payment details)
- Auto-email receipt after payment
- Add "Download Receipt" button to member profile payment history
- Support for GST invoices (GSTIN, HSN code, tax breakdown)

**User Stories:**
- As a gym owner, I want to auto-email PDF receipts to members after they pay
- As a librarian, I want to print receipt copies for members who don't have email
- As a member, I want to download all my payment receipts in one click
- As an accountant, I want GST-compliant invoices with proper tax breakdown

**Technical Notes:**
- Use `@cloudflare/puppeteer` for PDF generation on Workers
- Store receipts in R2 bucket (Cloudflare object storage)
- Generate unique receipt numbers (ORG-YYYY-NNNN format)
- Support custom org branding (logo, colors, footer text)
- Internationalization ready (English + Hindi)

**Acceptance Criteria:**
- [ ] PDF receipt generation working
- [ ] Receipt template with org logo
- [ ] Auto-email receipt after payment
- [ ] Download receipt button in UI
- [ ] GST invoice support (optional)
- [ ] Receipt numbering system

---

## Phase 2: v1.1 Growth Features (6 Weeks)

**Goal:** Increase retention, reduce churn, reduce Excel dependency

### Feature #3: Bulk Operations (RICE: 69)
**Effort:** 6-7 days
**Priority:** P1

**What:**
- Bulk send payment reminders (email + WhatsApp)
- Bulk update member status (active → inactive, on hold)
- Bulk export (CSV, Excel with filters)
- Bulk import (members, payments)
- Bulk extend subscriptions (add 30 days to all expiring members)

**User Stories:**
- As a gym owner, I want to send payment reminders to all 50 members expiring this week in one click
- As a librarian, I want to mark all members with overdue books as "on hold"
- As a tuition center operator, I want to export all students in "Batch A" to Excel
- As an admin, I want to extend subscriptions for all annual members by 7 days (COVID compensation)

**Technical Notes:**
- Add checkbox selection to member list
- Bulk action dropdown (send reminder, update status, export, extend)
- Queue long-running operations (export, send reminders)
- Progress indicator for bulk operations
- Audit log for bulk actions (who did what, when)

**Acceptance Criteria:**
- [ ] Bulk select members with filters
- [ ] Bulk send reminders (email + WhatsApp)
- [ ] Bulk update status
- [ ] Bulk export (CSV, Excel)
- [ ] Bulk extend subscriptions
- [ ] Progress indicator + audit log

---

### Feature #4: Advanced Reporting (RICE: 34)
**Effort:** 8-10 days
**Priority:** P1

**What:**
- Monthly revenue report (breakdown by payment method, plan)
- Member aging report (new, 1-6 months, 6-12 months, 12+ months)
- Attendance summary report (daily, weekly, monthly trends)
- Expiring subscriptions forecast (next 7/15/30 days)
- Scheduled reports (auto-email monthly digest)
- Export all reports to Excel/PDF

**User Stories:**
- As a gym owner, I want to see monthly revenue trends and compare to last year
- As a librarian, I want to know how many members joined each month
- As a tuition center operator, I want to see attendance trends by batch
- As an accountant, I want to auto-receive monthly revenue reports via email

**Technical Notes:**
- Use D1 analytics queries (aggregates, window functions)
- Chart library for visualizations (Chart.js or Recharts)
- Scheduled reports using Cloudflare Cron Triggers
- Export to Excel (SheetJS) and PDF (Puppeteer)
- Cache expensive reports (1-hour TTL)

**Acceptance Criteria:**
- [ ] Monthly revenue report with charts
- [ ] Member aging report
- [ ] Attendance summary report
- [ ] Expiring subscriptions forecast
- [ ] Scheduled reports (email digest)
- [ ] Export to Excel and PDF

---

### Feature #5: Attendance Analytics (RICE: 35)
**Effort:** 5-6 days
**Priority:** P1

**What:**
- Peak hours heatmap (which hours are busiest)
- Member attendance % (how often members check in)
- Average session duration (check-in to check-out)
- Attendance trends (daily, weekly, monthly)
- Identify inactive members (no check-ins in 30 days)

**User Stories:**
- As a gym owner, I want to see which hours are busiest to optimize staff scheduling
- As a librarian, I want to identify members who haven't visited in 30 days
- As a tuition center operator, I want to see average class attendance per batch
- As an admin, I want to send re-engagement messages to inactive members

**Technical Notes:**
- Use existing check-in/check-out data
- Heatmap visualization (hourly × day-of-week)
- Calculate attendance % (check-ins / days active × 100)
- Flag inactive members (no check-ins in 30 days)
- Integration with bulk operations (send reminders to inactive members)

**Acceptance Criteria:**
- [ ] Peak hours heatmap
- [ ] Member attendance % dashboard
- [ ] Inactive member detection (30-day threshold)
- [ ] Attendance trends (daily, weekly, monthly)
- [ ] Export attendance reports

---

## Phase 3: v1.2 Vertical Expansion (6 Weeks)

**Goal:** Deepen fit for libraries and tuition centers

### Feature #6: Late Fee Automation (Libraries) (RICE: 38)
**Effort:** 5-6 days
**Priority:** P1

**What:**
- Auto-calculate overdue fees based on days late
- Late fee rules per plan (₹5/day, ₹100 max)
- Late fee waiver (admin can waive fees)
- Late fee reports (total overdue, by member)
- Integration with payment recording (pay subscription + late fee together)

**User Stories:**
- As a librarian, I want to auto-calculate ₹5/day late fees for overdue memberships
- As a librarian, I want to waive late fees for students with valid excuses
- As a member, I want to see my late fee amount on my profile
- As an accountant, I want to see total late fees collected per month

**Technical Notes:**
- Add `lateFeePerDay` and `maxLateFee` to subscription plans
- Calculate late fee: `min((days overdue × rate), maxLateFee)`
- Store late fees in `payments` table with type `late_fee`
- UI to waive late fees (admin only)
- Late fee report in dashboard

**Acceptance Criteria:**
- [ ] Late fee rules in subscription plan settings
- [ ] Auto-calculate late fees on member profile
- [ ] Late fee waiver UI (admin only)
- [ ] Late fee report in dashboard
- [ ] Pay subscription + late fee together

---

### Feature #7: Batch Management (Tuition Centers) (RICE: 21)
**Effort:** 10-12 days
**Priority:** P1

**What:**
- Create batches (e.g., "Class 10 Math", "NEET Physics")
- Assign members to batches (one member, multiple batches)
- Batch schedule (Monday 5-7 PM, Wednesday 5-7 PM)
- Batch attendance (link check-ins to batch sessions)
- Batch reports (revenue, attendance, member count)

**User Stories:**
- As a tuition center operator, I want to create batches for different subjects/classes
- As a tuition center operator, I want to assign students to multiple batches
- As a teacher, I want to see attendance for each batch session
- As an admin, I want to see revenue generated per batch

**Technical Notes:**
- Add `batches` table (name, schedule, orgId)
- Add `memberBatches` join table (memberId, batchId)
- Link check-ins to batch sessions (optional batchId in check-ins)
- Batch attendance report (% attendance per batch)
- Batch revenue report (sum of payments from batch members)

**Acceptance Criteria:**
- [ ] Create/edit/delete batches
- [ ] Assign members to batches (one-to-many)
- [ ] Batch schedule (recurring days/times)
- [ ] Batch attendance (link check-ins to sessions)
- [ ] Batch reports (revenue, attendance, member count)

---

## Phase 4: v2.0 Scale & Premium (8-10 Weeks)

**Goal:** Enable larger customers, unlock premium tier (₹2000+/month)

### Feature #8: Payment Gateway Integration (Razorpay) (RICE: 25)
**Effort:** 15-18 days
**Priority:** P2

**What:**
- Razorpay integration (payment links, QR codes, auto-capture)
- Online payment collection (members pay via link)
- Auto-renewal (charge card automatically when subscription expires)
- Payment link generation (WhatsApp/email link to pay)
- Webhook handling (payment success, failure, refund)

**User Stories:**
- As a gym owner, I want to send payment links via WhatsApp for contactless payment
- As a member, I want to pay my subscription online using UPI/card
- As a gym owner, I want to auto-charge annual members when their subscription renews
- As an admin, I want to track online vs offline payment trends

**Technical Notes:**
- Use Razorpay API (Node.js SDK)
- Payment link generation (short URL, QR code)
- Webhook endpoint to capture payment success
- Store payment gateway reference ID in `payments` table
- Auto-renewal logic (cron job to charge expiring subscriptions)

**Acceptance Criteria:**
- [ ] Razorpay integration (test + live keys)
- [ ] Generate payment links (WhatsApp/email)
- [ ] QR code generation for payments
- [ ] Webhook handling (success, failure, refund)
- [ ] Auto-renewal (charge card when subscription expires)
- [ ] Payment gateway dashboard (success rate, failures)

---

### Feature #9: Member Self-Service Portal (RICE: 23)
**Effort:** 12-14 days
**Priority:** P2

**What:**
- Member login (phone + OTP, Google OAuth)
- View subscription status, payment history, attendance
- Update profile (photo, emergency contact)
- Download receipts
- Request subscription freeze (on hold)
- Rate/review facility (NPS survey)

**User Stories:**
- As a member, I want to log in and see my subscription expiry date
- As a member, I want to download all my payment receipts
- As a member, I want to request a subscription freeze when I travel
- As a gym owner, I want members to update their own profiles instead of calling me

**Technical Notes:**
- Separate auth flow for members (phone OTP via WhatsApp)
- Member-facing pages under `/portal/` route
- Read-only access to subscription, payments, attendance
- Request freeze → creates inquiry (admin approves)
- NPS survey integration (post-payment or monthly)

**Acceptance Criteria:**
- [ ] Member login (phone OTP + Google OAuth)
- [ ] View subscription status, payment history, attendance
- [ ] Update profile (photo, emergency contact)
- [ ] Download receipts
- [ ] Request subscription freeze
- [ ] NPS survey (post-payment or monthly)

---

### Feature #10: Multi-Location Support (Basic) (RICE: 18)
**Effort:** 18-20 days
**Priority:** P2

**What:**
- Multiple locations under one org (e.g., "Gold's Gym - Pune", "Gold's Gym - Mumbai")
- Assign members to home location
- Location-specific staff (owner can see all locations, staff see only their location)
- Location-specific reports (revenue, attendance per location)
- Transfer members between locations

**User Stories:**
- As a gym chain owner, I want to manage multiple branches in one account
- As a location manager, I want to see only my location's members and reports
- As an owner, I want to see consolidated reports across all locations
- As a member, I want to transfer my subscription from Pune to Mumbai branch

**Technical Notes:**
- Add `locations` table (name, address, orgId)
- Add `locationId` to members, staff, payments, check-ins
- Location filter in all queries (staff see only their location)
- Owner role sees all locations (aggregate reports)
- Transfer member → update `locationId` in `members` table

**Acceptance Criteria:**
- [ ] Create/edit/delete locations
- [ ] Assign members to home location
- [ ] Location-specific staff access (staff see only their location)
- [ ] Location filter in all reports
- [ ] Transfer members between locations
- [ ] Consolidated reports for owners (all locations)

---

## Features to DEFER (Post-v2.0)

### ❌ Mobile App (iOS/Android)
**Why Defer:**
- Responsive web is sufficient for MVP
- Build only if mobile traffic >60% or customer requests exceed 20%
- Native app requires 2-3 months development + App Store approval
- Web app works perfectly on mobile browsers (PWA-ready)

**Build This Instead:**
- Progressive Web App (PWA) with offline support
- Mobile-optimized UI (already responsive)
- Push notifications via web (Chrome, Safari support)

---

### ❌ Social Features (Member Community)
**Why Defer:**
- Low priority for B2B SaaS (not a consumer app)
- Uncertain ROI (gyms/libraries don't need social features)
- Scope creep risk (forums, messaging, likes, comments)

**Build This Instead:**
- Focus on WhatsApp integration (better channel for gym/library communication)
- Bulk messaging for announcements

---

### ❌ Advanced Analytics (ML/AI Predictions)
**Why Defer:**
- Current dashboard charts are sufficient for MVP
- ML models require 6-12 months of historical data
- Premature optimization (focus on core features first)

**Build This Instead:**
- Simple reports (revenue, attendance, expiring subscriptions)
- Scheduled reports (monthly email digest)

---

### ❌ QR Code Check-In
**Why Defer:**
- Manual check-in works fine for MVP
- Requires hardware (QR scanner or tablet at entrance)
- Low ROI (saves 5 seconds per check-in)

**Build This Instead:**
- Fast manual check-in (search by name, phone, or member ID)
- Bulk check-in (check in multiple members at once)

---

## Competitive Positioning

### ✅ Your Unfair Advantages

1. **WhatsApp-First** — Native integration (competitors don't have this)
2. **Modern Stack** — Fast (Cloudflare Workers edge deploy) vs legacy desktop software
3. **Simple Onboarding** — CSV import from Excel (5-minute setup vs days)
4. **Multi-Vertical** — One product for gyms, libraries, tuition (competitors specialize)
5. **Affordable** — SaaS pricing (₹500-2000/month) vs ₹50k+ desktop licenses
6. **Mobile-Friendly** — Responsive web (no app install required)

### 🔲 Table Stakes You Need

1. **Email Notifications** — Every competitor has this
2. **Receipts/Invoices** — Expected for payment management
3. **Payment Gateway** — Most gym software has Razorpay integration
4. **Bulk Operations** — Power users need this (send reminders, export data)
5. **Advanced Reporting** — Monthly revenue, member aging, attendance trends

---

## Success Metrics (OKRs)

### v1.0 Launch (Q1 2026)
**Objective:** Acquire first 50 paying customers

**Key Results:**
- [ ] 50 organizations onboarded (10 gyms, 5 libraries, 5 tuition)
- [ ] 90% send ≥10 email/WhatsApp notifications per week
- [ ] 80% record ≥20 payments per month
- [ ] NPS ≥ 40 (satisfied users)
- [ ] Churn rate <10% per month

---

### v1.1 Retention (Q2 2026)
**Objective:** Increase retention, reduce Excel dependency

**Key Results:**
- [ ] Monthly churn <5%
- [ ] 60% use bulk operations monthly
- [ ] 70% download ≥1 report monthly
- [ ] Average session time >10 minutes (up from 5)
- [ ] Feature adoption: 80% use email notifications, 70% use receipts

---

### v1.2 Vertical Expansion (Q3 2026)
**Objective:** Deepen fit for libraries & tuition centers

**Key Results:**
- [ ] 30% of signups are libraries/tuition (up from 10%)
- [ ] 80% of libraries use late fee automation
- [ ] 90% of tuition centers create ≥2 batches
- [ ] Vertical churn <3% per month
- [ ] NPS ≥ 50 (promoters)

---

### v2.0 Scale (Q4 2026)
**Objective:** Enable larger customers, unlock premium tier

**Key Results:**
- [ ] 20% of customers on premium tier (₹2000+/month)
- [ ] 50% collect payments via payment gateway
- [ ] 30% have ≥2 locations
- [ ] Average contract value >₹1500/month (up from ₹800)
- [ ] Enterprise pipeline: 10 leads with ≥5 locations

---

## Immediate Next Steps

### Week 1-2: Email Notification System
**Owner:** Fullstack Developer
**Tasks:**
1. Integrate Resend.com email service
2. Create email templates (welcome, payment reminder, expiry alert, receipt, payment confirmation)
3. Add email preferences to org settings (email only, WhatsApp only, or both)
4. Build email queue with retry logic (Cloudflare Queues or D1 + cron)
5. Email delivery tracking dashboard (sent, delivered, bounced, opened)

**Deliverables:**
- [ ] Email service integration tested
- [ ] 5 core email templates designed and coded
- [ ] Email preferences UI in org settings
- [ ] Email queue with retry logic
- [ ] Email delivery tracking dashboard

---

### Week 3-4: Receipt Generation
**Owner:** Fullstack Developer
**Tasks:**
1. Add PDF generation library (`@cloudflare/puppeteer`)
2. Create receipt template (org logo, GST optional, payment details)
3. Auto-email receipt after payment
4. Add "Download Receipt" button to member profile payment history
5. Receipt numbering system (ORG-YYYY-NNNN format)
6. Store receipts in R2 bucket (Cloudflare object storage)

**Deliverables:**
- [ ] PDF receipt generation working
- [ ] Receipt template with org logo
- [ ] Auto-email receipt after payment
- [ ] Download receipt button in UI
- [ ] Receipt numbering system
- [ ] GST invoice support (optional)

---

### Week 5: Launch v1.0
**Owner:** Product Manager
**Tasks:**
1. Deploy to production (Cloudflare Workers)
2. Onboard first 10 beta customers (3 gyms, 3 libraries, 4 tuition)
3. Collect feedback via NPS survey + user interviews
4. Iterate on bugs and UX issues
5. Begin marketing to gyms in Pune/Bangalore (Google Ads, Instagram)

**Deliverables:**
- [ ] v1.0 deployed to production
- [ ] 10 beta customers onboarded
- [ ] Feedback collected (NPS + interviews)
- [ ] Bug fixes deployed (if any)
- [ ] Marketing campaign launched (Google Ads, Instagram)

---

## Risk Analysis & Mitigations

### Risk 1: Email Deliverability Issues
**Impact:** High (emails land in spam, users don't see notifications)
**Mitigation:**
- Use Resend.com (high deliverability, SPF/DKIM/DMARC setup)
- Add unsubscribe link to all emails (CAN-SPAM compliance)
- Monitor bounce rate and pause emails for bounced addresses
- Warm up email domain (send 10-50 emails/day for first week)

---

### Risk 2: PDF Generation Performance
**Impact:** Medium (slow receipt generation delays payments)
**Mitigation:**
- Use `@cloudflare/puppeteer` (optimized for Workers)
- Generate receipts asynchronously (queue job, email link when ready)
- Cache receipt templates (avoid re-rendering unchanged parts)
- Fallback: Use HTML receipts if PDF generation fails

---

### Risk 3: Feature Creep (Scope Expansion)
**Impact:** High (delays v1.0 launch, increases churn risk)
**Mitigation:**
- Stick to RICE-prioritized roadmap (top 10 features only)
- Defer low-priority features (mobile app, social features)
- Say "no" to custom requests from beta customers (capture as feedback)
- Time-box development (if not done in 2 weeks, defer to next phase)

---

### Risk 4: Razorpay Integration Complexity
**Impact:** Medium (delays v2.0 premium features)
**Mitigation:**
- Start integration in v1.2 (parallel to batch management)
- Use Razorpay test environment for early testing
- Hire Razorpay integration expert (if needed)
- Fallback: Manual payment recording (keep existing flow)

---

### Risk 5: Multi-Location Complexity
**Impact:** High (breaks existing single-location assumptions)
**Mitigation:**
- Build basic multi-location first (locations table, location filter)
- Defer advanced features (location-specific pricing, cross-location transfers)
- Test with 1-2 multi-location customers before general release
- Fallback: Keep single-location mode as default (multi-location opt-in)

---

## Competitive Landscape Analysis

### Key Competitors (India)

| Competitor | Price | Strengths | Weaknesses | Our Advantage |
|------------|-------|-----------|------------|---------------|
| **Zen Gym Software** | ₹1500/mo | Established (10+ years), biometrics | Desktop only, legacy UI | Web-based, mobile-friendly |
| **GymEx** | ₹999/mo | Mobile app, payment gateway | Gym-only, poor support | Multi-vertical, WhatsApp-first |
| **LibSoft** | ₹50k one-time | Library-specific, barcode support | Expensive, desktop only | SaaS pricing, modern stack |
| **Tuition Manager** | ₹799/mo | Batch management, attendance | Tuition-only, no WhatsApp | Multi-vertical, WhatsApp-first |
| **Excel Spreadsheets** | Free | Familiar, flexible | Manual work, error-prone | Automated reminders, reports |

---

## Go-to-Market Strategy

### Target Segments (Priority Order)

1. **Gyms (40% of TAM)**
   - Pain: Manual payment tracking, missed renewals
   - Value Prop: Auto reminders, WhatsApp-first, fast check-in
   - Marketing: Google Ads ("gym management software India"), Instagram

2. **Libraries (30% of TAM)**
   - Pain: Overdue tracking, late fee calculation
   - Value Prop: Late fee automation, member aging reports
   - Marketing: Library associations, school partnerships

3. **Tuition Centers (30% of TAM)**
   - Pain: Batch management, attendance tracking
   - Value Prop: Batch reports, bulk attendance, WhatsApp reminders
   - Marketing: Tuition franchise networks, Facebook groups

---

### Pricing Strategy

| Plan | Price (INR/mo) | Features | Target Audience |
|------|----------------|----------|-----------------|
| **Starter** | ₹499 | 50 members, 1 staff | Small gyms, home tutors |
| **Pro** | ₹999 | 200 members, 3 staff, bulk ops | Mid-size gyms, libraries |
| **Premium** | ₹1999 | 1000 members, 10 staff, payment gateway | Gym chains, large tuition centers |
| **Enterprise** | Custom | Unlimited, multi-location, priority support | Multi-location chains |

---

## Appendix: Full Feature Backlog (100+ Features)

### Member Management
- [x] Member CRUD (create, read, update, delete)
- [x] Member profiles (photo, phone, email, emergency contact)
- [x] Member search (name, phone, email, member ID)
- [x] Member filters (active, inactive, expiring soon)
- [x] Member tags (VIP, student, senior citizen)
- [ ] Member groups (family memberships)
- [ ] Member referrals (track who referred whom)
- [ ] Member notes (private notes for staff)
- [ ] Member photos (upload, crop, resize)
- [ ] Member ID cards (print, download)

### Subscription Management
- [x] Subscription plans (create, edit, delete)
- [x] Flexible pricing (daily, weekly, monthly, yearly)
- [x] Flexible duration (30 days, 60 days, custom)
- [x] Member subscriptions (assign plan, track expiry)
- [x] Subscription status (active, expired, on hold)
- [ ] Subscription freeze (pause for travel, illness)
- [ ] Subscription transfer (between members)
- [ ] Subscription upgrade/downgrade (change plan)
- [ ] Subscription add-ons (personal training, locker)
- [ ] Subscription discounts (first-time, referral, seasonal)

### Payment Management
- [x] Payment recording (amount, date, method)
- [x] Payment methods (cash, UPI, card, bank transfer)
- [x] Payment history (per member, per org)
- [x] Payment search (by date, amount, method)
- [ ] Payment receipts (PDF, auto-email)
- [ ] Payment refunds (partial, full)
- [ ] Payment pending (track unpaid subscriptions)
- [ ] Payment gateway (Razorpay integration)
- [ ] Payment links (WhatsApp, email)
- [ ] Auto-renewal (charge card automatically)

### Attendance Management
- [x] Check-in/check-out (manual entry)
- [x] Attendance history (per member)
- [x] Attendance dashboard (today's check-ins)
- [ ] Attendance analytics (peak hours, trends)
- [ ] Bulk check-in (check in multiple members)
- [ ] QR code check-in (scan QR to check in)
- [ ] Biometric check-in (fingerprint, face)
- [ ] Attendance reports (daily, weekly, monthly)
- [ ] Attendance alerts (no check-in in 30 days)
- [ ] Batch attendance (link check-ins to batches)

### Notifications & Communication
- [x] WhatsApp notifications (payment reminders)
- [ ] Email notifications (payment reminders, expiry alerts)
- [ ] SMS notifications (payment reminders)
- [ ] Push notifications (web, mobile app)
- [ ] Bulk notifications (send to multiple members)
- [ ] Notification templates (customizable)
- [ ] Notification scheduling (send at specific time)
- [ ] Notification preferences (email, WhatsApp, SMS, or all)
- [ ] Notification history (sent, delivered, read)
- [ ] Notification analytics (open rate, click rate)

### Reporting & Analytics
- [x] Dashboard (revenue, active members, expiring subscriptions)
- [ ] Monthly revenue report (breakdown by payment method, plan)
- [ ] Member aging report (new, 1-6 months, 6-12 months, 12+ months)
- [ ] Attendance summary report (daily, weekly, monthly trends)
- [ ] Expiring subscriptions forecast (next 7/15/30 days)
- [ ] Scheduled reports (auto-email monthly digest)
- [ ] Export reports (CSV, Excel, PDF)
- [ ] Custom reports (build your own)
- [ ] Report templates (save and reuse)
- [ ] Report scheduling (daily, weekly, monthly)

### Staff & Access Control
- [x] Staff management (add, remove staff)
- [x] Role-based access (owner, staff)
- [ ] Staff permissions (view only, edit, delete)
- [ ] Staff activity log (who did what, when)
- [ ] Staff notifications (new member, expiring subscription)
- [ ] Staff shifts (schedule staff working hours)
- [ ] Staff performance (check-ins handled, payments collected)
- [ ] Staff commission (% of payments collected)

### Inquiries & Lead Management
- [x] Inquiry capture (name, phone, source)
- [x] Inquiry status (new, contacted, converted, lost)
- [x] Inquiry follow-up (track next follow-up date)
- [x] Inquiry conversion (convert to member)
- [ ] Inquiry source tracking (Google Ads, Instagram, referral)
- [ ] Inquiry pipeline (new → contacted → demo → converted)
- [ ] Inquiry reminders (follow up after 3 days)
- [ ] Inquiry analytics (conversion rate, source ROI)

### Vertical-Specific Features
- [ ] Late fee automation (libraries)
- [ ] Batch management (tuition centers)
- [ ] Book lending (libraries)
- [ ] Equipment booking (gyms)
- [ ] Personal training (gyms)
- [ ] Diet plans (gyms)
- [ ] Exam management (tuition centers)
- [ ] Fee structure (tuition centers)

### Integrations
- [x] WhatsApp (notifications, reminders)
- [x] Google OAuth (login, sign up)
- [ ] Razorpay (payment gateway)
- [ ] Google Sheets (export, import)
- [ ] Zapier (connect to 5000+ apps)
- [ ] Slack (notifications, alerts)
- [ ] Calendly (schedule demos, consultations)
- [ ] Mailchimp (email marketing)

### Settings & Configuration
- [x] Org settings (name, logo, address, GST)
- [x] Email preferences (email, WhatsApp, or both)
- [ ] Custom branding (logo, colors, domain)
- [ ] Subscription plan templates (gym, library, tuition)
- [ ] Payment method configuration (enable/disable)
- [ ] Tax configuration (GST, service tax)
- [ ] Currency configuration (INR, USD, etc.)
- [ ] Language configuration (English, Hindi, etc.)

---

## Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-02-12 | 1.0 | Product Manager | Initial roadmap created |

---

**Document End**
