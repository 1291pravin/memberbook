# MemberBook — Design System

## Color Tokens

Primary: indigo scale (primary-50 through primary-700)
- primary-600: #4f46e5 — CTA buttons, active states, links
- primary-700: #4338ca — hover on primary, dark CTA backgrounds
- primary-50/100: tinted backgrounds, subtle highlights

Accent: amber scale (accent-50 through accent-700)
- accent-500: #f59e0b — payment/financial contexts, warnings
- accent-50/100: tinted backgrounds for payment cards

Semantic: danger (red), success (green), warning (yellow), info (blue)
Neutrals: slate scale — all readable text uses slate-600, slate-700, slate-800

## Typography

Headings: Poppins (font-heading)
Body: Open Sans (font-body)
Anti-aliasing: webkit + moz

Text color hierarchy:
- slate-800: headings, names, critical data (14:1 contrast)
- slate-700: labels, subheadings, card titles (10.7:1)
- slate-600: body text, descriptions, metadata (7.1:1 — WCAG AA+)
- slate-500: muted/de-emphasized only (4.6:1 — WCAG AA minimum, use sparingly)
- slate-400: decorative icons only

## Spacing & Layout

Max widths: max-w-5xl (1024px) for feature content, max-w-6xl (1152px) for hero
Padding: px-4 on mobile, responsive padding on desktop
Section rhythm: py-20 for major sections

## Components

AppButton: primary, secondary, danger, ghost variants; sm/md/lg sizes
AppInput: full-width, labeled, with focus ring (focus:ring-primary-500)
AppSelect: consistent with AppInput
AppCard: white bg, border-slate-200/80, shadow-sm, rounded-xl
AppStatCard: metric + label + optional subtitle + icon slot
AppBadge: semantic color badges for status
AppModal: overlay-based, focus trap
AppEmptyState: icon + heading + description + optional CTA
AppSearchBar: search input with icon

## Dashboard Layout

Desktop: fixed 64px sidebar (slate-800→slate-900 gradient), main content max-w-5xl
Mobile: white header + fixed bottom tab bar (4 core items) + "More" bottom sheet
Active states: bg-primary-600/15 + text-primary-200 on dark sidebar

## Motion

Transitions: 150–250ms, ease-out
Page transitions: no orchestration
State changes: color + shadow only (no layout animation)
Accordion: grid-rows transition for smooth height animation

## Public/Brand Pages

Layout: max-w-6xl hero, max-w-4xl/5xl content sections
Background: white and slate-50 alternating sections
CTA band: bg-primary-700 with white text
Header: sticky, backdrop-blur, bg-white/80
