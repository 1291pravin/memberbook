# PRD: Check-In/Checkout Feature

**Version:** 1.0
**Date:** 2026-02-08
**Status:** Draft
**Target Verticals:** Gym, Library, Tuition Center

---

## Problem Statement

Gym owners, librarians, and tuition center operators need a way to track when members physically enter and exit their facilities. Currently, MemberBook manages memberships and payments but lacks attendance tracking capabilities. Without check-in/checkout records, operators cannot:

- Monitor facility usage patterns
- Verify if members are actually using their active subscriptions
- Calculate session durations (critical for libraries tracking borrowed items and gyms monitoring facility usage)
- Identify no-shows and infrequent users
- Provide accountability for security and safety compliance

This creates a gap in operational visibility, especially for gyms tracking peak hours and libraries managing resource access.

---

## Target Users

**Primary:**
- Staff members (check-in desk, front desk) performing member check-ins and checkouts
- Gym owners monitoring facility usage and member engagement

**Secondary:**
- Library staff tracking borrower visits
- Tuition center administrators managing student attendance

**User Roles:**
- Both `owner` and `staff` roles can perform check-in/checkout operations
- Only members with active status can be searched for check-in (inactive members can be checked in with a warning)

---

## Proposed Solution

### Core Feature: Manual Check-In/Checkout System

Staff searches for a member by name or phone from the dashboard and marks them checked in. The system records:
- Member ID
- Check-in timestamp
- Staff member who performed check-in
- Current subscription status (active/expired/none)

When the member leaves, staff can mark them checked out, recording:
- Checkout timestamp
- Session duration (calculated)

### User Flows

#### Flow 1: Check-In a Member
1. Staff navigates to Dashboard or Members page
2. Clicks "Check-In Member" button (new action)
3. Search modal opens with member search (reuses existing AppSearchBar pattern)
4. Staff types member name or phone number
5. System shows matching members with:
   - Name, phone
   - Current subscription status badge (active/expired/no subscription)
   - Warning indicator if subscription is expired or inactive
6. Staff clicks "Check In" on selected member
7. If subscription is expired/inactive/missing:
   - Warning banner appears: "This member has an expired/inactive subscription. Continue anyway?"
   - Staff confirms to proceed
8. System records check-in with timestamp
9. Success message shown
10. Modal closes

#### Flow 2: View Current Check-Ins
1. Staff navigates to Dashboard
2. New "Checked In Now" stat card shows count of currently checked-in members
3. Click on stat card to see list of checked-in members with:
   - Name, phone
   - Check-in time (e.g., "2 hours ago")
   - Subscription status
   - "Check Out" button

#### Flow 3: Check-Out a Member
1. From "Checked In Now" list, staff clicks "Check Out" button
2. System records checkout timestamp
3. Calculates and displays session duration
4. Success message shown
5. Member removed from checked-in list

#### Flow 4: Forgotten Checkout (Auto-cleanup)
1. System runs daily cleanup job (server cron or scheduled task)
2. Any check-ins older than 24 hours with no checkout are auto-checked-out
3. Checkout time set to end of business day (configurable, default: 10 PM)

---

## Success Metrics

**Adoption Metrics:**
- Percentage of organizations using check-in feature within 30 days of release
- Average check-ins per organization per week

**Engagement Metrics:**
- Check-in completion rate (check-ins with matching checkouts)
- Average session duration by vertical

**Business Impact:**
- Correlation between check-in frequency and subscription renewal rate
- Reduction in support queries about "member hasn't shown up"

---

## Technical Considerations

### Database Schema

New table: `check_ins`

```typescript
export const checkIns = sqliteTable("check_ins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  memberId: integer("member_id").notNull().references(() => members.id),
  checkInTime: text("check_in_time").notNull(), // ISO 8601 timestamp
  checkOutTime: text("check_out_time"), // nullable, ISO 8601 timestamp
  durationMinutes: integer("duration_minutes"), // calculated on checkout
  checkedInByUserId: integer("checked_in_by_user_id").notNull().references(() => users.id),
  checkedOutByUserId: integer("checked_out_by_user_id").references(() => users.id),
  subscriptionStatus: text("subscription_status"), // active, expired, none at time of check-in
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});
```

**Indexes:**
- `(orgId, checkOutTime)` for querying currently checked-in members
- `(orgId, memberId, checkInTime)` for member attendance history

### API Routes

**POST** `/api/orgs/[orgId]/check-ins`
- Body: `{ memberId: number }`
- Returns: `{ checkIn: CheckIn }`
- Business logic:
  - Verify member exists and belongs to org
  - Check if member already checked in (prevent duplicate check-ins)
  - Query latest subscription status
  - Record check-in with current timestamp

**PUT** `/api/orgs/[orgId]/check-ins/[checkInId]/checkout`
- Body: `{}` (no body needed)
- Returns: `{ checkIn: CheckIn }` (with checkout time and duration)
- Business logic:
  - Calculate duration: `(checkOutTime - checkInTime) in minutes`
  - Update record with checkout timestamp and duration

**GET** `/api/orgs/[orgId]/check-ins/active`
- Query params: `none`
- Returns: `{ checkIns: Array<CheckIn & { memberName, memberPhone }> }`
- Business logic: Return all check-ins with `checkOutTime = null`

**GET** `/api/orgs/[orgId]/check-ins`
- Query params: `page, limit, memberId?, startDate?, endDate?`
- Returns: `{ checkIns: Array<CheckIn & { memberName }>, pagination: Meta }`
- Business logic: Support filtering and pagination for attendance reports

### Frontend Components

**New Pages:**
- `/dashboard/check-in` - Check-in modal/page (can be modal overlay on dashboard)

**Modified Pages:**
- `/dashboard/index.vue` - Add "Checked In Now" stat card and "Check-In Member" quick action
- `/dashboard/members/[id].vue` - Add "Check-In History" section showing past check-ins

**New Components:**
- `CheckInModal.vue` - Search and check-in members
- `CheckedInList.vue` - Show currently checked-in members with checkout buttons

### Multi-Tenancy
- All queries scoped to `orgId` via `requireOrgAccess(event)`
- Staff members can only check in members from their own organization

---

## Edge Cases

### Double Check-In
**Scenario:** Staff tries to check in a member who is already checked in.
**Solution:** API returns error: "Member is already checked in. Please check them out first." UI shows error banner with "View Checked-In Member" link.

### Forgotten Checkout
**Scenario:** Staff forgets to check out a member at end of day.
**Solution:**
- Daily cleanup job auto-checks-out all check-ins older than 24 hours
- Checkout time set to 10 PM (configurable per org in settings)
- Dashboard shows warning banner: "3 members were auto-checked-out from yesterday"

### Expired Subscription Check-In
**Scenario:** Member with expired subscription tries to check in.
**Solution:**
- Show warning banner in check-in modal: "Subscription expired on [date]. Continue anyway?"
- Allow check-in but record `subscriptionStatus: "expired"`
- Staff can proceed or navigate to member profile to renew subscription

### Member Without Subscription
**Scenario:** Member has no active or past subscriptions.
**Solution:**
- Show warning: "No subscription found. Continue anyway?"
- Record `subscriptionStatus: "none"`
- Allow check-in (useful for trial sessions or walk-ins)

### Inactive Member Check-In
**Scenario:** Member status is "inactive".
**Solution:**
- Show warning: "This member is marked inactive. Continue anyway?"
- Allow check-in (they may be reactivating)

### Staff Deletes Member While Checked In
**Scenario:** Member is checked in, but admin deletes their profile.
**Solution:** Database foreign key constraint prevents deletion. UI shows error: "Cannot delete member while checked in. Please check them out first."

---

## MVP Scope (Phase 1)

**Must-Have:**
- Manual check-in via search modal
- Manual checkout from checked-in members list
- Dashboard stat card: "Checked In Now"
- Subscription status warning during check-in (warn but allow)
- Basic check-in history on member profile page
- Daily auto-checkout cleanup job

**Included:**
- All three verticals (gym, library, tuition)
- Both owner and staff roles can perform check-in/checkout
- Duration calculation

**Not Included (Future):**
- QR code or barcode scanning for check-in
- Mobile app for self-service check-in
- Member-facing check-in history or app
- Biometric check-in
- Automated reports on attendance patterns
- Export check-in data to CSV
- Check-in analytics (peak hours, usage trends)

---

## Future Enhancements (Phase 2+)

**Phase 2: Analytics & Reporting**
- Attendance report: daily/weekly/monthly check-in counts
- Member engagement score based on check-in frequency
- Peak hours chart for gyms
- Export check-in records to CSV
- Filter by date range, plan, subscription status

**Phase 3: Self-Service & Automation**
- QR code generation for members (scan at entry)
- Self-service kiosk mode (tablet at front desk)
- SMS/WhatsApp check-in confirmations
- Automated WhatsApp reminder if member hasn't checked in for X days

**Phase 4: Advanced Features**
- Check-in streak tracking (gamification)
- Member app showing personal check-in history
- Capacity tracking (max occupancy alerts for gyms)
- Integration with access control systems (door locks, turnstiles)

---

## Out of Scope

**Explicitly NOT building in this iteration:**
- Automated check-in via RFID, NFC, or biometric devices
- Member-facing mobile app or portal
- Integration with third-party gym management hardware
- Check-in for non-members (trial users, visitors) - requires separate entity
- Check-in across multiple locations (multi-branch support)
- Time-based access control (e.g., "member can only check in between 6 AM - 10 PM")
- Class or session-based check-ins (e.g., yoga class at 5 PM) - requires separate "sessions" entity

---

## User Stories

### Story 1: Staff Checks In a Member
**As a** gym staff member,
**I want to** quickly search for a member by name or phone and check them in,
**So that** I can track who is currently using the facility.

**Acceptance Criteria:**
- [ ] Staff can access check-in modal from dashboard with one click
- [ ] Search returns results as user types (minimum 2 characters)
- [ ] Search works for both name and phone number
- [ ] Member's current subscription status is displayed before check-in
- [ ] Check-in is recorded with timestamp and staff user ID
- [ ] Success message confirms check-in

### Story 2: Staff Sees Warning for Expired Subscription
**As a** gym staff member,
**I want to** see a warning when checking in a member with an expired subscription,
**So that** I can follow up on renewal but still allow entry.

**Acceptance Criteria:**
- [ ] Warning banner appears if subscription is expired
- [ ] Warning shows expiry date
- [ ] Staff can proceed with check-in despite warning
- [ ] Subscription status is recorded with check-in record

### Story 3: Staff Checks Out a Member
**As a** gym staff member,
**I want to** mark a member as checked out when they leave,
**So that** the system accurately reflects current occupancy.

**Acceptance Criteria:**
- [ ] Staff can view list of currently checked-in members
- [ ] Each checked-in member has a "Check Out" button
- [ ] Check-out records timestamp and calculates duration
- [ ] Member is removed from checked-in list after checkout

### Story 4: System Auto-Checks-Out Forgotten Members
**As a** gym owner,
**I want to** automatically check out members who were not checked out manually,
**So that** my check-in data remains accurate without manual cleanup.

**Acceptance Criteria:**
- [ ] Check-ins older than 24 hours are auto-checked-out daily
- [ ] Checkout time is set to 10 PM (configurable)
- [ ] Auto-checkout does not overwrite manual checkouts

### Story 5: Prevent Double Check-In
**As a** system,
**I want to** prevent a member from being checked in twice,
**So that** data integrity is maintained.

**Acceptance Criteria:**
- [ ] API returns error if member is already checked in
- [ ] UI shows error message with option to view current check-in
- [ ] Staff can check out member before re-checking in

### Story 6: View Member Check-In History
**As a** gym owner,
**I want to** see a member's past check-in history on their profile,
**So that** I can understand their facility usage patterns.

**Acceptance Criteria:**
- [ ] Member profile page shows list of past check-ins (last 10)
- [ ] Each check-in shows date, time, duration
- [ ] Check-ins sorted by most recent first

---

## Dependencies

**Engineering:**
- Schema migration for `check_ins` table
- Server-side API routes under `/api/orgs/[orgId]/check-ins`
- Frontend components: CheckInModal, CheckedInList
- Dashboard stats integration

**Design:**
- Warning banner component for expired subscriptions (reuse AppBadge or create AlertBanner)
- Check-in modal layout (can reuse AppModal pattern)

**Infrastructure:**
- Daily cron job or scheduled task for auto-checkout (Cloudflare Workers Cron Triggers)

---

## Risks & Mitigations

**Risk 1: Staff forgets to check out members**
- **Impact:** Inaccurate occupancy data
- **Mitigation:** Daily auto-checkout cleanup job

**Risk 2: Search performance degrades with large member lists**
- **Impact:** Slow check-in experience
- **Mitigation:** Add database index on `members.name` and `members.phone`, limit search results to 20

**Risk 3: Timezone confusion for check-in timestamps**
- **Impact:** Incorrect duration calculations
- **Mitigation:** Store all timestamps in UTC (ISO 8601 format), display in org's local timezone in UI

**Risk 4: Users expect barcode/QR scanning**
- **Impact:** Manual search seems slow compared to automated check-in
- **Mitigation:** Clearly communicate this is Phase 1, QR codes are roadmapped for Phase 3

---

## Compliance & Privacy

**Data Privacy:**
- Check-in timestamps are considered attendance data (not PII but still sensitive)
- Included in member data export for GDPR compliance
- When member is deleted, check-in records are anonymized (member_id set to NULL or flagged)

**Multi-Tenancy:**
- Check-in records are strictly scoped to organization
- No cross-org visibility

**Audit Trail:**
- Each check-in records which staff member performed the action
- Useful for accountability and security compliance

---

## Open Questions

1. **Auto-checkout time:** Should 10 PM default be configurable per organization?
   - **Decision:** Yes, add to organization settings (future enhancement, default to 10 PM for MVP)

2. **Notification on check-in:** Should members receive SMS/WhatsApp confirmation when checked in?
   - **Decision:** Not in MVP, defer to Phase 3 (self-service enhancements)

3. **Capacity limits:** Should system warn when facility is at max capacity?
   - **Decision:** Out of scope for MVP, requires org-level capacity setting

4. **Check-in for non-members:** Should walk-ins or trial users be checkable-in?
   - **Decision:** Out of scope, requires separate entity (inquiries or trial_users)

---

## Implementation Estimates

**Backend (schema + API routes):** 3-4 days
**Frontend (modal + dashboard integration):** 3-4 days
**Auto-checkout job:** 1 day
**Testing & edge cases:** 2 days
**Documentation:** 1 day

**Total:** ~10-12 days (2 weeks for one full-stack developer)

---

## Launch Plan

**Beta:** Release to 3-5 pilot organizations (1 gym, 1 library, 1 tuition center)
**Feedback Period:** 2 weeks
**GA Release:** Roll out to all organizations after addressing beta feedback

**Success Criteria for GA:**
- 80% of beta orgs use check-in feature at least 3 times per week
- No critical bugs or data integrity issues
- Positive feedback on search speed and ease of use
