# Autopilot File Templates

## ROADMAP.md

```markdown
# Product Roadmap

## How to Use
Add features below in priority order. The PM agent picks the top unmarked item.
Mark items as [x] when their PR is merged.

## Backlog

- [ ] <Feature name> — <One-line description>
```

## CONFIG.md

Auto-detect and populate from the project:

```markdown
# Autopilot Config

## Project
- **Name:** <from package.json>
- **Type:** <web-app | api | cli | library>
- **Framework:** <detected framework>

## Commands
- **Dev Server:** <detected, e.g., npm run dev>
- **Build:** <detected, e.g., npm run build>
- **Lint:** <detected, e.g., npx eslint .>
- **Test:** <detected, e.g., npm test, or "none">

## QA
- **Method:** size-based
- **Small features:** QA skipped — Dev Agent runs build + lint on final task
- **Large features:** Full QA — build, lint, and Playwright browser testing

## Limits
- **Max Attempts Per Task:** 3
- **Branch Prefix:** feature/autopilot-
```

**Important:** After generating CONFIG.md, verify each command exists in `package.json` scripts. If a command doesn't exist (e.g., no test script), set it to `"none"`.

## PRD.md

```markdown
# PRD: <Feature Name>

## Source
Roadmap item: "<exact text from ROADMAP.md>"

## Overview
<2-3 sentence description of what this feature does and why it matters>

## Feature Size
<small | large>

## User Stories
- As a <role>, I want <action> so that <benefit>

## Requirements
1. <Specific, implementable requirement>
2. <...>

## Technical Approach
- <How to implement, which files to modify/create>
- <API routes, components, schema changes needed>

## Out of Scope
- <What this feature does NOT include>
```

## TASK.md

Valid status values: `awaiting_approval`, `building`, `testing`, `creating_pr`

For **small** features:
```markdown
# Tasks: <Feature Name>

## Status: awaiting_approval

## Build Tasks
- [ ] <Task 1 — specific, atomic unit of work> (attempts: 0/3)
- [ ] <Task 2> (attempts: 0/3)

## QA Tasks
*Skipped — small feature (build + lint verified by Dev Agent on final task)*

## Failure Log
<empty — agents append here when tasks fail>
```

For **large** features:
```markdown
# Tasks: <Feature Name>

## Status: awaiting_approval

## Build Tasks
- [ ] <Task 1 — specific, atomic unit of work> (attempts: 0/3)
- [ ] <Task 2> (attempts: 0/3)
- [ ] <Task 3> (attempts: 0/3)

## QA Tasks
- [ ] Build passes (attempts: 0/3)
- [ ] Lint passes (attempts: 0/3)
- [ ] Playwright test — <what to verify> (attempts: 0/3)

## Failure Log
<empty — agents append here when tasks fail>
```

### Attempt Counter Format

All agents must use this exact format: `(attempts: N/3)` where N is the current count. To increment, change `N` to `N+1`. Example: `(attempts: 1/3)` → `(attempts: 2/3)`.
