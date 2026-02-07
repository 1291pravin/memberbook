# Product Manager Memory

## V1 Feature Inventory (as of 2026-02-06)

### Completed Core Features
- **Authentication**: Email/password + Google OAuth (session-based)
- **Multi-tenancy**: Full org isolation with owner/staff roles
- **Member Management**: Create, edit, view members with status tracking
- **Subscription Plans**: Create/edit plans with flexible duration (daily/weekly/monthly/yearly)
- **Subscriptions**: Assign plans to members, renewals, change plan, track expiry
- **Payments**: Record payments, track payment status (unpaid/partial/paid), payment methods (cash/UPI/card/bank_transfer)
- **Inquiries**: Lead capture with status pipeline (new/contacted/converted/lost)
- **Dashboard**: Stat cards, analytics charts (revenue trend, member growth, payment methods, subscription status, plan popularity, inquiry funnel)
- **Staff Management**: Invite staff via WhatsApp, owner/staff role separation
- **Settings**: Org profile, subscription grace period, cache management
- **Pagination**: Members and payments lists with server-side pagination
- **WhatsApp Integration**: Renewal reminders, staff invitations
- **Filtering & Search**: Members by status/subscription/payment, sorting

### Known Gaps for V1
1. **No CSV/Excel Import** — Critical for onboarding existing gyms/libraries with member lists
2. **No Data Export** — Can't export member data, payments for backup/analysis
3. **No Bulk Operations** — Can't bulk-update member status, send reminders
4. **Limited Payment Tracking** — No invoices, receipts, or payment history export
5. **No Reporting** — Can't generate monthly revenue reports, attendance logs
6. **No Mobile App** — Web-only (but responsive design exists)
7. **No Attendance Tracking** — Gyms need daily check-in/check-out logs
8. **No Late Fee Calculation** — Libraries need automated late fee tracking
9. **No Batch Management** — Tuition centers need class/batch grouping
10. **No Email Notifications** — Only WhatsApp (limited if customer doesn't use WA)

### V1 Priority Assessment
**Must-have before v1 launch:**
- CSV Import for members (onboarding blocker)
- Basic data export (members, payments)
- Email notifications (payment reminders, expiry alerts)

**Should-have but can ship without:**
- Bulk operations
- Advanced reporting
- Attendance tracking (can be v1.1 for gyms)
- Batch management (can be v1.1 for tuition centers)

**Nice-to-have for later:**
- Mobile app
- Late fee automation
- Invoice generation
- Multi-org dashboard (for chain operators)

## Target User Personas

### Persona 1: Small Gym Owner (Primary)
- Name: Rajesh, 35, owns FitZone Gym in Pune
- Pain: Managing 100+ members on Excel/notebook, losing track of renewals
- Jobs to be done: Track who paid, who's expiring, send WhatsApp reminders
- Must-have: Member list, payment tracking, renewal alerts, WhatsApp integration
- Nice-to-have: Attendance tracking, diet plans, progress photos

### Persona 2: Library Owner (Secondary)
- Name: Meera, 42, runs community library in Bangalore
- Pain: Manual tracking of borrowers, subscriptions, late fees
- Jobs to be done: Track subscriber status, collect monthly fees, follow up on renewals
- Must-have: Member subscriptions, payment tracking, status management
- Nice-to-have: Late fee automation, book inventory, borrowing history

### Persona 3: Tuition Center Owner (Secondary)
- Name: Sunil, 38, coaching center for 10th/12th students
- Pain: Managing fee collection across multiple batches, parent communication
- Jobs to be done: Track student enrollment, batch assignments, fee collection
- Must-have: Student profiles, batch grouping, payment tracking
- Nice-to-have: Attendance, exam scores, parent portal

## Market Context (Indian SMB)

### Key Requirements
- **Currency**: INR only (stored as paise internally)
- **Payment Methods**: Cash, UPI, Card, Bank Transfer (UPI is dominant)
- **Communication**: WhatsApp is primary channel (more than email)
- **Pricing**: Must be affordable for SMBs (₹500-2000/month range)
- **Onboarding**: Must be fast — import existing member list from Excel
- **Language**: English UI is acceptable (most SMB owners are comfortable)

### Competitive Landscape
- **Excel/Google Sheets**: Free but manual, error-prone
- **WhatsApp Groups**: Free but unstructured
- **Notebook/Register**: Traditional, no digital backup
- **Gym/Library Software**: Expensive, complex, desktop-only
- **MemberBook Advantage**: Simple, affordable, mobile-friendly, WhatsApp-native

## Feature Prioritization Framework

### RICE Scoring (Reach × Impact × Confidence / Effort)
- **CSV Import**: 100 × 10 × 90% / 3 = **300** (Must-do)
- **Email Notifications**: 100 × 8 × 80% / 5 = **128** (High priority)
- **Attendance Tracking**: 50 × 7 × 70% / 8 = **44** (Medium priority)
- **Invoice Generation**: 60 × 5 × 60% / 6 = **30** (Low priority for v1)
- **Mobile App**: 80 × 9 × 50% / 20 = **18** (Post-v1)

### V1 Decision: Ship with Import + Export + Email
- Core membership & payment management is complete
- Add CSV import, export, and email notifications
- Launch as v1.0 targeting gyms first (largest segment)
- Plan v1.1 for library-specific features (late fees)
- Plan v1.2 for tuition-specific features (batch management)

## Technical Constraints
- Multi-tenancy pattern is solid (orgId scoping enforced)
- Component library is complete (AppButton, AppCard, etc.)
- API routes follow consistent pattern (server/api/orgs/[orgId]/)
- Authentication is production-ready (session + OAuth)
- Tests exist for all major features (auth, members, payments, plans, inquiries)
- Deployment ready (Cloudflare Workers + D1)

## Notes on Code Quality
- ESLint configured and enforced
- TypeScript interfaces defined for all data models
- Server-side validation with orgAccess middleware
- Client-side composables for reusable logic (useOrg, useApi, useFormatCurrency)
- Pagination implemented correctly (server + client)
- Caching strategy in place (10min TTL, manual cache clear)
- Git history shows steady progress (30+ commits)

## PRDs Written

### Check-In/Checkout Feature (2026-02-08)
**Status:** Draft PRD completed
**File:** `check-in-checkout-feature-prd.md` (in agent memory)
**Scope:** Manual check-in/checkout system for all three verticals (gym, library, tuition)
**Key Decisions:**
- Warn but allow check-in for expired/inactive subscriptions
- Auto-checkout after 24 hours to prevent stale data
- Staff-operated (not self-service in MVP)
- Full check-in + checkout tracking with duration calculation
- No QR codes, RFID, or barcode scanning in MVP (Phase 3)

**Implementation Estimate:** 10-12 days
**Target Verticals:** All (gym, library, tuition center)
**Gap Addressed:** Attendance tracking (#7 in V1 gaps list)

**Next Steps:**
- Review with fullstack-developer for technical feasibility
- Estimate database migration effort
- Confirm auto-checkout job implementation on Cloudflare Workers
- Design UI mockups with ui-ux-expert
- Plan beta rollout to 3-5 pilot organizations
