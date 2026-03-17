#!/usr/bin/env node

/**
 * Add a user as staff to an organization in MemberBook D1 database.
 *
 * Usage:
 *   node scripts/add-staff.mjs <user-email> <org-id>
 *   node scripts/add-staff.mjs 1291pravin@gmail.com 5
 *
 * Options:
 *   --role <role>   Role to assign (staff|owner), default: staff
 *   --local         Run against local D1 instead of remote
 */

import { execSync } from "node:child_process";

const args = process.argv.slice(2);
const isLocal = args.includes("--local");
const roleIdx = args.indexOf("--role");
const role = roleIdx !== -1 ? args[roleIdx + 1] : "staff";

// Filter out flags to get positional args
const positional = args.filter(
  (a, i) => !a.startsWith("--") && (i === 0 || !args[i - 1]?.startsWith("--"))
);
const [email, orgId] = positional;

if (!email || !orgId) {
  console.error("Usage: node scripts/add-staff.mjs <user-email> <org-id> [--role staff|owner] [--local]");
  process.exit(1);
}

if (!["staff", "owner"].includes(role)) {
  console.error(`Invalid role "${role}". Must be "staff" or "owner".`);
  process.exit(1);
}

const DB_NAME = "memberbook-db-prd";
const remoteFlag = isLocal ? "" : "--remote";

function d1(sql) {
  const cmd = `npx wrangler d1 execute ${DB_NAME} ${remoteFlag} --command "${sql.replace(/"/g, '\\"')}"`;
  const output = execSync(cmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
  // Parse JSON from wrangler output
  const jsonMatch = output.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  const parsed = JSON.parse(jsonMatch[0]);
  return parsed[0]?.results || [];
}

// Step 1: Find user by email
console.log(`Looking up user: ${email}`);
const users = d1(`SELECT id, email, name FROM users WHERE email = '${email.toLowerCase().trim()}'`);

if (users.length === 0) {
  console.error(`No user found with email: ${email}`);
  process.exit(1);
}

const user = users[0];
console.log(`Found user: ${user.name} (id: ${user.id})`);

// Step 2: Verify org exists
const orgs = d1(`SELECT id, name FROM organizations WHERE id = ${orgId}`);
if (orgs.length === 0) {
  console.error(`No organization found with id: ${orgId}`);
  process.exit(1);
}
console.log(`Organization: ${orgs[0].name} (id: ${orgId})`);

// Step 3: Check if membership already exists
const existing = d1(
  `SELECT id, role FROM org_memberships WHERE user_id = ${user.id} AND org_id = ${orgId}`
);
if (existing.length > 0) {
  console.log(`User already has "${existing[0].role}" membership (id: ${existing[0].id}). No changes made.`);
  process.exit(0);
}

// Step 4: Insert membership
const result = d1(
  `INSERT INTO org_memberships (user_id, org_id, role, created_at) VALUES (${user.id}, ${orgId}, '${role}', datetime('now')) RETURNING *`
);

if (result.length > 0) {
  console.log(`Added ${user.name} as "${role}" to ${orgs[0].name} (membership id: ${result[0].id})`);
} else {
  console.error("Failed to insert membership.");
  process.exit(1);
}
