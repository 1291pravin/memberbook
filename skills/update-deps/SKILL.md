---
name: update-deps
description: Check for outdated/deprecated npm packages, update them, and fix breaking changes. Run weekly.
user_invocable: true
trigger: /update-deps
---

# Update Dependencies

Run a comprehensive dependency audit and update for the MemberBook project.

## Steps

1. **Check outdated packages:**
   - Run `npm outdated` to list all outdated packages
   - Run `npm audit` to check for security vulnerabilities

2. **Identify deprecated packages:**
   - Run `npm ls 2>&1 | grep -i deprecated` or check each outdated package for deprecation notices
   - For any deprecated package, research the recommended replacement

3. **Categorize updates by risk:**
   - **Patch updates** (1.0.x → 1.0.y): Safe, update all
   - **Minor updates** (1.x → 1.y): Usually safe, review changelogs for breaking changes
   - **Major updates** (x → y): Review changelog, check migration guides

4. **Present a summary table to the user BEFORE updating:**
   - Package name, current version, latest version, update type (patch/minor/major), deprecated (yes/no)
   - Highlight any packages with known breaking changes
   - Ask for user approval before proceeding

5. **Apply updates (after approval):**
   - Run `npm update` for patch/minor updates
   - For major updates, run `npm install package@latest` individually
   - For deprecated packages, install the replacement package

6. **Verify nothing is broken:**
   - Run `npm run build` to check for build errors
   - Run `npx eslint .` to check for lint errors
   - If build fails, investigate and fix the breaking changes in the code

7. **Report results:**
   - Summary of what was updated
   - Any code changes made to fix breaking changes
   - Any packages skipped and why
   - Recommend user to test the app manually

## Important
- Never auto-commit. Present all changes for user review.
- If a major update has complex breaking changes, flag it and ask the user whether to proceed or skip.
- Check Cloudflare Workers compatibility for any runtime-affecting updates.
