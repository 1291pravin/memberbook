#!/usr/bin/env node
/**
 * Runs on system startup — checks for new signups & contact submissions,
 * then sends a WhatsApp summary to Pravin's number.
 *
 * Usage:
 *   node scripts/daily-notify.mjs
 *   node scripts/daily-notify.mjs --days 7
 *
 * Setup (Windows startup):
 *   node scripts/daily-notify.mjs --install
 *
 * Remove from startup:
 *   node scripts/daily-notify.mjs --uninstall
 */

import { execSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  delay,
  fetchLatestWaWebVersion,
} from "@whiskeysockets/baileys";
import pino from "pino";
import qrcode from "qrcode-terminal";

const __dirname = resolve(fileURLToPath(import.meta.url), "..");
const ROOT = resolve(__dirname, "..");
const SESSION_DIR = join(ROOT, "outreach", ".wa-session");
const MY_NUMBER = "919137849812@s.whatsapp.net";

const args = process.argv.slice(2);

// ── Install / Uninstall startup task ─────────────────────────────────────────

if (args.includes("--install")) {
  const scriptPath = resolve(__dirname, "daily-notify.mjs").replace(/\//g, "\\");
  const nodePath = process.execPath.replace(/\//g, "\\");
  const cmd = `schtasks /create /tn "MemberBook Daily Notify" /tr "\\"${nodePath}\\" \\"${scriptPath}\\"" /sc onlogon /delay 0001:00 /rl highest /f`;
  try {
    execSync(cmd, { stdio: "inherit" });
    console.log("\n✓ Installed as Windows startup task (runs 1 min after login).");
    console.log('  Task name: "MemberBook Daily Notify"');
    console.log("  To remove: node scripts/daily-notify.mjs --uninstall");
  } catch (e) {
    console.error("Failed to install. Try running as Administrator.");
  }
  process.exit(0);
}

if (args.includes("--uninstall")) {
  try {
    execSync('schtasks /delete /tn "MemberBook Daily Notify" /f', { stdio: "inherit" });
    console.log('\n✓ Removed "MemberBook Daily Notify" from startup tasks.');
  } catch {
    console.error("Task not found or already removed.");
  }
  process.exit(0);
}

// ── Fetch signups data ───────────────────────────────────────────────────────

const DB_NAME = "memberbook-db-prd";

function d1(sql) {
  const oneLine = sql.replace(/\s+/g, " ").trim();
  const escaped = oneLine.replace(/"/g, '\\"');
  const cmd = `npx wrangler d1 execute ${DB_NAME} --remote --json --command "${escaped}"`;
  try {
    const output = execSync(cmd, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      cwd: ROOT,
    });
    const parsed = JSON.parse(output);
    return parsed[0]?.results || [];
  } catch (e) {
    console.error("Wrangler query failed:", e.message);
    return [];
  }
}

function getSinceDate() {
  const daysIdx = args.indexOf("--days");
  const days = daysIdx !== -1 ? parseInt(args[daysIdx + 1], 10) : 2;
  const d = new Date();
  d.setDate(d.getDate() - (isNaN(days) ? 2 : days));
  return d.toISOString().slice(0, 10);
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

function buildMessage(sinceDate, registrations, contacts) {
  const lines = [];
  lines.push(`📊 *MemberBook Update*`);
  lines.push(`Since: ${sinceDate}\n`);

  // Registrations
  if (registrations.length === 0) {
    lines.push(`📋 *New Registrations:* None`);
  } else {
    lines.push(`📋 *New Registrations (${registrations.length}):*`);
    for (const r of registrations) {
      lines.push(`• *${r.org_name}* (${r.org_type})`);
      lines.push(`  ${r.owner_name} — ${r.owner_email}`);
      lines.push(`  ${formatDate(r.registered_at)}`);
    }
  }

  lines.push("");

  // Contact submissions
  if (contacts.length === 0) {
    lines.push(`📬 *Contact Submissions:* None`);
  } else {
    lines.push(`📬 *Contact Submissions (${contacts.length}):*`);
    for (const c of contacts) {
      lines.push(`• *${c.name}* — ${c.business_name}`);
      lines.push(`  📱 ${c.phone} | ✉️ ${c.email}`);
      lines.push(`  ${c.message.slice(0, 100)}${c.message.length > 100 ? "…" : ""}`);
      lines.push(`  ${formatDate(c.created_at)} | Status: ${c.status}`);
    }
  }

  if (registrations.length === 0 && contacts.length === 0) {
    lines.push("\n_No new activity. All quiet!_ ✨");
  }

  return lines.join("\n");
}

// ── Send WhatsApp ────────────────────────────────────────────────────────────

async function sendWhatsApp(message) {
  await mkdir(SESSION_DIR, { recursive: true });
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestWaWebVersion({});

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "silent" }),
  });

  sock.ev.on("creds.update", saveCreds);

  // Wait for connection
  await new Promise((resolve, reject) => {
    sock.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect, qr } = update;
      if (qr) {
        qrcode.generate(qr, { small: true });
        console.log("\nScan QR code with WhatsApp to link.\n");
      }
      if (connection === "open") {
        console.log("WhatsApp connected.");
        resolve();
      }
      if (connection === "close") {
        const code = lastDisconnect?.error?.output?.statusCode;
        if (code === DisconnectReason.loggedOut) {
          reject(new Error("WhatsApp logged out. Delete outreach/.wa-session/ and re-scan."));
        } else {
          reject(new Error(`WhatsApp connection closed: ${code}`));
        }
      }
    });

    // Timeout after 30s
    setTimeout(() => reject(new Error("WhatsApp connection timeout")), 30_000);
  });

  await sock.sendMessage(MY_NUMBER, { text: message });
  console.log("✓ WhatsApp message sent.");

  await delay(2000);
  sock.end();
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const sinceDate = getSinceDate();
  console.log(`Checking activity since ${sinceDate}...\n`);

  const registrations = d1(`
    SELECT o.id AS org_id, o.name AS org_name, o.type AS org_type,
           o.created_at AS registered_at, u.name AS owner_name, u.email AS owner_email
    FROM organizations o
    JOIN org_memberships m ON m.org_id = o.id AND m.role = 'owner'
    JOIN users u ON u.id = m.user_id
    WHERE o.created_at >= '${sinceDate}'
    ORDER BY o.created_at DESC
  `);

  const contacts = d1(`
    SELECT id, name, phone, email, business_name, message, status, created_at
    FROM contact_submissions
    WHERE created_at >= '${sinceDate}'
    ORDER BY created_at DESC
  `);

  console.log(`Registrations: ${registrations.length}, Contacts: ${contacts.length}`);

  const message = buildMessage(sinceDate, registrations, contacts);
  console.log("\n--- Message Preview ---");
  console.log(message);
  console.log("--- End Preview ---\n");

  await sendWhatsApp(message);
  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
