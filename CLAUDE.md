# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MemberBook is a Nuxt 4 full-stack web application with authentication, Tailwind CSS styling, and NuxtHub deployment support.

## Commands

- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run preview` — Preview production build locally
- `npm run generate` — Generate static site
- `npm run postinstall` — Run `nuxt prepare` (auto-runs after install)
- `npx eslint .` — Lint the project

## Tech Stack

- **Framework:** Nuxt 4.3 (Vue 3.5, Vue Router 4)
- **Styling:** Tailwind CSS 4 via Vite plugin
- **Auth:** nuxt-auth-utils (session-based, configured via `NUXT_SESSION_PASSWORD` env var)
- **Deployment:** @nuxthub/core for edge deployment
- **Build:** Vite, TypeScript, ES modules
- **Linting:** ESLint with @nuxt/eslint preset

## Architecture

- `app/app.vue` — Root application component
- `app/assets/css/main.css` — Tailwind CSS entry point
- `nuxt.config.ts` — Nuxt config: modules, Vite plugins, CSS imports
- `eslint.config.mjs` — ESLint config extending Nuxt's generated config from `.nuxt/`
- `.env` — Environment variables (session password); `.env.example` should be maintained for reference

Nuxt conventions apply: pages go in `app/pages/`, layouts in `app/layouts/`, components in `app/components/`, server routes in `server/api/`, composables in `app/composables/`.

## Git

- Do not use claude as the commit author
