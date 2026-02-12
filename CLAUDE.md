# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MemberBook is a multi-tenant SaaS application for managing memberships, subscriptions, and payments — targeting gyms, libraries, and tuition centers. Built as a Nuxt 4 full-stack app deployed to Cloudflare Workers.

## Development Workflow

Work directly with Claude for all development tasks (features, bug fixes, UI changes, etc.). Claude will:
- Read existing code before making changes
- Plan implementations before writing code
- Iterate based on errors and feedback
- Follow established project patterns

**Optional agents for specific reviews:**
- **code-reviewer** — Use before merging PRs: "Review this PR before merge"
- **security-auditor** — Use for periodic audits: "Audit all API routes for security"
- **data-migrator** — Use for importing member data from external sources

## Commands

- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run preview` — Preview production build locally
- `npx eslint .` — Lint the project
- `npx drizzle-kit generate` — Generate DB migration from schema changes
- `npx drizzle-kit migrate` — Apply migrations locally

## Tech Stack

- **Framework:** Nuxt 4.3 (Vue 3.5, Vue Router 4)
- **Styling:** Tailwind CSS 4 via Vite plugin
- **Database:** Drizzle ORM with Cloudflare D1 (SQLite)
- **Auth:** nuxt-auth-utils (session-based + Google OAuth)
- **Deployment:** cloudflare Workers edge deployment
- **Linting:** ESLint with @nuxt/eslint preset

## Architecture

### Multi-Tenancy Model

All data is scoped to an organization (`orgId`). Users belong to organizations via `orgMemberships` with roles: `owner` or `staff`. The `useOrg()` composable on the frontend and `requireOrgAccess(event)` on the server enforce org context throughout.

### Authentication

Two auth methods: email/password and Google OAuth. Session management via `nuxt-auth-utils`. Server-side helpers in `server/utils/auth.ts` (`requireAuth`, `findUserByEmail`, `findUserByGoogleId`).

### Server API Pattern

All org-scoped API routes live under `server/api/orgs/[orgId]/` and use `requireOrgAccess(event)` to validate the user has membership in the org. This returns `{ userId, orgId, role }`. Owner-only routes additionally call `requireOwner(access)`.

Resources: members, payments, plans, inquiries, staff — all nested under the org.

### Frontend Routing & Middleware

- **`auth`** middleware — requires login, redirects to `/login`
- **`guest`** middleware — redirects logged-in users to `/dashboard`
- **`org-required`** middleware — requires auth + active org, redirects to `/onboarding`

Dashboard pages use the `dashboard` layout (sidebar on desktop, bottom nav on mobile). Public pages use `default` layout.

### Database Schema

Defined in `server/db/schema.ts` using Drizzle ORM. Monetary amounts (price, amount) are stored in **paise** (integer, 1/100 of INR). Migrations go in `server/db/migrations/sqlite/`.

Key tables: `users`, `organizations`, `orgMemberships`, `subscriptionPlans`, `members`, `memberSubscriptions`, `payments`, `inquiries`.

### Reusable Components

UI primitives in `app/components/`: `AppButton`, `AppInput`, `AppSelect`, `AppCard`, `AppModal`, `AppBadge`, `AppEmptyState`, `AppSearchBar`, `AppStatCard`. Use these instead of raw HTML elements for consistency.

### Key Composables

- `useOrg()` — current org state, `loadOrgs()`, `setOrg()`, `clearOrg()`, computed `orgId`
- `useApi()` — typed `$fetch` wrapper with Content-Type header
- `useFormatCurrency()` — currency formatting
- `useWhatsApp()` — WhatsApp messaging integration

## Environment Variables

Required in `.env`:

- `NUXT_SESSION_PASSWORD` — session secret (min 32 chars)
- `NUXT_OAUTH_GOOGLE_CLIENT_ID` — Google OAuth client ID
- `NUXT_OAUTH_GOOGLE_CLIENT_SECRET` — Google OAuth client secret

## Git

- Do not use claude as the commit author
