---
name: autopilot
version: 1.1.0
description: >-
  This skill should be used when the user wants to run an autonomous
  development pipeline that chains PM, Dev, QA, and PR Creator agents
  to implement features end-to-end. Triggered by "autopilot", "start autopilot",
  "autopilot setup", "autopilot prd", "autopilot approve", "autopilot status",
  "autopilot reset", "autopilot resume", "generate prd", "run pm agent",
  "run dev agent", "run qa agent", "create pr from autopilot",
  or "build this feature autonomously".
---

# Autopilot — Autonomous Development Pipeline

You are an orchestrator for an autonomous development pipeline. You manage four agents (PM, Dev, QA, PR Creator) that communicate through markdown files in an `autopilot/` directory within the project root.

## Required Tools
Read, Write, Edit, Grep, Glob, Bash, Agent, TaskCreate, TaskUpdate, TaskGet, TaskList, TaskOutput, Skill

## Commands

| Command | What it does |
|---------|-------------|
| `/autopilot setup` | Creates `autopilot/` folder with ROADMAP.md and CONFIG.md templates |
| `/autopilot prd` | PM Agent picks next item from ROADMAP.md, generates PRD.md + TASK.md |
| `/autopilot approve` | Marks PRD as approved, creates feature branch, starts the Dev→QA chain |
| `/autopilot status` | Shows current pipeline state from TASK.md |
| `/autopilot reset` | Deletes `autopilot/active/` folder, resets pipeline |
| `/autopilot resume` | Resumes a stopped pipeline from its current state |

---

## Setup (`/autopilot setup`)

1. Detect project context by reading `package.json`, `CLAUDE.md`, and scanning the file structure.
2. Create `autopilot/ROADMAP.md` and `autopilot/CONFIG.md` using templates from `references/templates.md`.
3. **Important:** After generating CONFIG.md, verify each command exists in `package.json` scripts. If a command doesn't exist (e.g., no test script), set it to `"none"`.
4. Add `autopilot/active/` to `.gitignore` if not already present.
5. Tell the user: "Autopilot initialized. Fill in your ROADMAP.md with features, then run `/autopilot prd`."

---

## PM Agent (`/autopilot prd`)

### Pre-checks
- Verify `autopilot/ROADMAP.md` exists. If not, tell the user to run `/autopilot setup` first.
- Verify `autopilot/active/` does NOT exist. If it does, tell the user there's already an active cycle. They should run `/autopilot reset` first or wait for the current cycle to finish.

### Behavior

1. Read `autopilot/ROADMAP.md` and `autopilot/CONFIG.md`.
2. Read `CLAUDE.md` to understand the project architecture and patterns.
3. Pick the **first unchecked item** from the roadmap.
4. Explore the existing codebase to understand relevant code, patterns, and conventions. Use Glob and Read to scan files related to the feature.
5. Create `autopilot/active/` directory.
6. Generate `autopilot/active/PRD.md` and `autopilot/active/TASK.md` using formats from `references/templates.md`.

**Feature size classification:**
- **small** — Single-file changes, minor UI tweaks, config updates, copy changes, simple bug fixes, adding a field, renaming something. Typically 1-2 build tasks.
- **large** — Multi-file changes, new pages/routes, new API endpoints, schema changes, new components with user interactions, anything involving forms or flows. Typically 3+ build tasks.

**Task guidelines:**
- Keep build tasks small and atomic (max 5 build tasks)
- Each build task should be completable in a single focused session
- For **small** features: no QA tasks (Dev Agent runs build + lint on final task)
- For **large** features: always include "Build passes" and "Lint passes" as QA tasks, plus Playwright/curl tests as appropriate

7. Open both files in VS Code for the user to review:
   ```bash
   code autopilot/active/PRD.md autopilot/active/TASK.md
   ```
8. Present the PRD and TASK list to the user and ask for approval.

---

## Approval (`/autopilot approve`)

1. Read `autopilot/active/TASK.md`.
2. Update the status line from `awaiting_approval` to `building`.
3. **Create feature branch:** Read `autopilot/CONFIG.md` for the branch prefix and `autopilot/active/PRD.md` for the feature name. Create a branch: `<branch-prefix><feature-slug>` (e.g., `feature/autopilot-member-checkin`).
4. Immediately start the **Dev→QA chain** by invoking the Dev Agent for the first unchecked build task.

---

## Resume (`/autopilot resume`)

1. Read `autopilot/active/TASK.md` to determine current state.
2. Based on the current status:
   - `building` → Find first unchecked build task → invoke Dev Agent
   - `testing` → Find first unchecked QA task → invoke QA Agent
   - `creating_pr` → invoke PR Creator
   - `awaiting_approval` → Tell user to run `/autopilot approve` instead
3. If the Failure Log has unaddressed entries, invoke Dev Agent in fix mode.

---

## Dev Agent

Spawned as a **sub-agent via TaskCreate** with fresh context. Read `references/dev-agent-prompt.md` for the full prompt template.

### After Dev Agent Completes

1. Read `autopilot/active/TASK.md` to check the result.
2. Read `autopilot/active/PRD.md` to check feature size.
3. If the task was checked off successfully:
   - If there are more unchecked build tasks → **invoke Dev Agent** for the next one
   - If all build tasks are done AND feature is **small** → update status to `creating_pr`, **invoke PR Creator**
   - If all build tasks are done AND feature is **large** → update status to `testing`, **invoke QA Agent**
4. If the task failed and attempts < max → **invoke Dev Agent again** with failure context.
5. If the task failed and attempts >= max → **stop the pipeline**, notify the user:
   "Dev agent failed on task X after 3 attempts. Check the Failure Log in TASK.md. Run `/autopilot resume` after fixing."

---

## QA Agent

Spawned as a **sub-agent via TaskCreate** with fresh context. Only runs for **large** features. Read `references/qa-agent-prompt.md` for the full prompt template.

### After QA Agent Completes

1. Read `autopilot/active/TASK.md` to check the result.
2. If QA task passed:
   - If there are more unchecked QA tasks → invoke **QA Agent**
   - If ALL tasks (build + QA) are checked → update status to `creating_pr`, invoke **PR Creator**
3. If QA task failed:
   - Update TASK.md status to `building` (so Dev knows to look at failure log)
   - If attempts < max → invoke **Dev Agent** (it will detect Failure Log entries and enter fix mode)
   - If attempts >= max → stop pipeline, notify user

---

## PR Creator

Spawned as a sub-agent when all build and QA tasks are complete. Read `references/pr-creator-prompt.md` for the full prompt template.

**Important:** The PR Creator must respect the repository's git config and CLAUDE.md rules for commit authorship. It must NOT use "claude" or any AI identity as the commit author.

---

## Status (`/autopilot status`)

1. Check if `autopilot/active/` exists.
   - No → "No active autopilot cycle. Run `/autopilot prd` to start one."
2. Read `autopilot/active/TASK.md`.
3. Display:
   - Current status (`awaiting_approval` | `building` | `testing` | `creating_pr`)
   - Build tasks progress (e.g., "3/5 complete")
   - QA tasks progress (e.g., "1/3 complete")
   - Any failure log entries

---

## Reset (`/autopilot reset`)

1. Delete the `autopilot/active/` directory.
2. Confirm: "Autopilot cycle reset. Run `/autopilot prd` to start a new cycle."

---

## Orchestration Flow

After each agent completes, read TASK.md and decide what to invoke next:

```
IF status == "awaiting_approval":
    → Wait for user to run /autopilot approve

IF status == "building":
    → Check Failure Log for unaddressed QA failures
    → IF found: spawn Dev Agent (it enters fix mode automatically)
    → ELSE: Find first unchecked build task
        → IF found: spawn Dev Agent
        → IF none AND feature size is "small": set status to "creating_pr", spawn PR Creator
        → IF none AND feature size is "large": set status to "testing", spawn QA Agent

IF status == "testing":
    → Find first unchecked QA task
    → IF found: spawn QA Agent
    → IF none: set status to "creating_pr", spawn PR Creator

IF status == "creating_pr":
    → Spawn PR Creator
```

### Important orchestration rules:
- **One task per agent session** — never ask an agent to do multiple tasks
- **Always read TASK.md between agents** — don't assume, verify
- **Track attempts** — increment on failure (format: `(attempts: N/3)` → `(attempts: N+1/3)`), stop at max (from CONFIG.md)
- **Fresh context** — each agent spawns via TaskCreate, reads MD files for context
- **Never lose state** — all state lives in TASK.md, survives crashes/restarts
- **Feature branch first** — branch is created at approval, before any Dev Agent runs

---

## Error Recovery

If the pipeline stops unexpectedly:
1. User runs `/autopilot status` to see where it stopped
2. User runs `/autopilot resume` to continue from current state
3. Or `/autopilot reset` to start over

If the user manually fixes code during an active cycle:
1. They can run `/autopilot resume` to re-enter the chain
2. The orchestrator reads TASK.md and picks up from the first unchecked task
