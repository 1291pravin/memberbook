#!/usr/bin/env node

/**
 * Check for new registrations and contact submissions in MemberBook D1 database.
 *
 * Usage:
 *   node scripts/check-signups.mjs
 *   node scripts/check-signups.mjs --days 7
 *   node scripts/check-signups.mjs --since 2026-03-15
 *   node scripts/check-signups.mjs --local
 *
 * Options:
 *   --days <n>       Look back N days (default: 2)
 *   --since <date>   Look back from a specific date (YYYY-MM-DD), overrides --days
 *   --local          Run against local D1 instead of remote
 */

import { execSync } from "node:child_process";

const args = process.argv.slice(2);
const isLocal = args.includes("--local");

const daysIdx = args.indexOf("--days");
const sinceIdx = args.indexOf("--since");

let sinceDate;

if (sinceIdx !== -1) {
  sinceDate = args[sinceIdx + 1];
  if (!sinceDate || !/^\d{4}-\d{2}-\d{2}$/.test(sinceDate)) {
    console.error('Invalid --since date. Use format YYYY-MM-DD (e.g. --since 2026-03-15)');
    process.exit(1);
  }
} else {
  const days = daysIdx !== -1 ? parseInt(args[daysIdx + 1], 10) : 2;
  if (isNaN(days) || days < 1) {
    console.error('Invalid --days value. Must be a positive integer.');
    process.exit(1);
  }
  const d = new Date();
  d.setDate(d.getDate() - days);
  sinceDate = d.toISOString().slice(0, 10);
}

const DB_NAME = "memberbook-db-prd";
const remoteFlag = isLocal ? "" : "--remote";

function d1(sql) {
  // Collapse multiline SQL to single line — wrangler --command breaks on newlines
  const oneLine = sql.replace(/\s+/g, " ").trim();
  const escaped = oneLine.replace(/"/g, '\\"');
  const cmd = `npx wrangler d1 execute ${DB_NAME} ${remoteFlag} --json --command "${escaped}"`;
  let output;
  try {
    output = execSync(cmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
  } catch (e) {
    const stdout = e.stdout || "";
    try {
      const errJson = JSON.parse(stdout);
      if (errJson.error) {
        console.error(`  Wrangler error: ${errJson.error.text}`);
        if (errJson.error.notes?.length) {
          console.error(`  ${errJson.error.notes.map(n => n.text).join(", ")}`);
        }
        console.error("\n  Try running: npx wrangler login");
        process.exit(1);
      }
    } catch {}
    throw e;
  }
  const parsed = JSON.parse(output);
  return parsed[0]?.results || [];
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

console.log(`\nChecking activity since: ${sinceDate} (${isLocal ? "local" : "remote"} DB)\n`);
console.log("=".repeat(60));

// ── New Registrations ────────────────────────────────────────
console.log("\n📋 NEW REGISTRATIONS\n");

const registrations = d1(`
  SELECT
    o.id        AS org_id,
    o.name      AS org_name,
    o.type      AS org_type,
    o.created_at AS registered_at,
    u.name      AS owner_name,
    u.email     AS owner_email
  FROM organizations o
  JOIN org_memberships m ON m.org_id = o.id AND m.role = 'owner'
  JOIN users u ON u.id = m.user_id
  WHERE o.created_at >= '${sinceDate}'
  ORDER BY o.created_at DESC
`);

if (registrations.length === 0) {
  console.log("  No new registrations.");
} else {
  console.log(`  Found ${registrations.length} new registration(s):\n`);
  for (const r of registrations) {
    console.log(`  [${r.org_id}] ${r.org_name} (${r.org_type})`);
    console.log(`       Owner : ${r.owner_name} <${r.owner_email}>`);
    console.log(`       Signed up : ${formatDate(r.registered_at)}`);
    console.log();
  }
}

// ── Contact Submissions ──────────────────────────────────────
console.log("=".repeat(60));
console.log("\n📬 CONTACT SUBMISSIONS\n");

const contacts = d1(`
  SELECT
    id,
    name,
    phone,
    email,
    business_name,
    message,
    status,
    source_page,
    created_at
  FROM contact_submissions
  WHERE created_at >= '${sinceDate}'
  ORDER BY created_at DESC
`);

if (contacts.length === 0) {
  console.log("  No new contact submissions.");
} else {
  console.log(`  Found ${contacts.length} new submission(s):\n`);
  for (const c of contacts) {
    console.log(`  [${c.id}] ${c.name} — ${c.business_name}`);
    console.log(`       Phone  : ${c.phone}`);
    console.log(`       Email  : ${c.email}`);
    console.log(`       Status : ${c.status}`);
    if (c.source_page) console.log(`       Source : ${c.source_page}`);
    console.log(`       At     : ${formatDate(c.created_at)}`);
    console.log(`       Msg    : ${c.message.slice(0, 120)}${c.message.length > 120 ? "…" : ""}`);
    console.log();
  }
}

console.log("=".repeat(60));
console.log(`\nDone. Showed activity from ${sinceDate} onwards.\n`);
