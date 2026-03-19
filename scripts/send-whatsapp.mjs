#!/usr/bin/env node
/**
 * WhatsApp outreach sender using Baileys
 *
 * Usage:
 *   node scripts/send-whatsapp.mjs outreach/2026-03-14-vashi-gym/raw.json
 *   node scripts/send-whatsapp.mjs outreach/2026-03-14-vashi-gym/raw.json --messages messages.json --auto --limit 15
 *
 * Flags:
 *   --messages <file>  JSON map of { phone: message } for custom per-lead messages
 *   --auto             Skip interactive confirmation prompt
 *   --limit <n>        Daily send cap (default: 15)
 *
 * First run shows a QR code — scan with WhatsApp to link.
 * Session persists in outreach/.wa-session/
 * Sent numbers logged to outreach/sent-log.json (dedup across runs).
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  delay,
  fetchLatestWaWebVersion,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import { isMobileNumber, normalizeIndianPhone } from './lib/phone.mjs';
import { generateMessages } from './lib/messages.mjs';

// ── Config ───────────────────────────────────────────────────────────────────
const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const SESSION_DIR = join(ROOT, 'outreach', '.wa-session');
const SENT_LOG_PATH = join(ROOT, 'outreach', 'sent-log.json');
const DEFAULT_LIMIT = 15;
const DELAY_MIN_MS = 8_000;
const DELAY_MAX_MS = 15_000;

// ── CLI parsing ─────────────────────────────────────────────────────────────
function parseFlags(argv) {
  const flags = { messagesFile: null, auto: false, limit: DEFAULT_LIMIT };
  for (let i = 3; i < argv.length; i++) {
    switch (argv[i]) {
      case '--messages': flags.messagesFile = argv[++i] || null; break;
      case '--auto': flags.auto = true; break;
      case '--limit': flags.limit = parseInt(argv[++i], 10) || DEFAULT_LIMIT; break;
    }
  }
  return flags;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function loadSentLog() {
  if (!existsSync(SENT_LOG_PATH)) return [];
  const raw = await readFile(SENT_LOG_PATH, 'utf-8');
  return JSON.parse(raw);
}

async function appendSentLog(entry) {
  const log = await loadSentLog();
  log.push(entry);
  await writeFile(SENT_LOG_PATH, JSON.stringify(log, null, 2));
}

function phoneToJid(normalizedPhone) {
  // Baileys uses <number>@s.whatsapp.net — strip the +
  return normalizedPhone.replace('+', '') + '@s.whatsapp.net';
}

function randomDelay() {
  return DELAY_MIN_MS + Math.floor(Math.random() * (DELAY_MAX_MS - DELAY_MIN_MS));
}

async function loadCustomMessages(filePath) {
  if (!filePath) return null;
  const resolved = resolve(filePath);
  if (!existsSync(resolved)) {
    console.error(`Custom messages file not found: ${filePath}`);
    process.exit(1);
  }
  const raw = await readFile(resolved, 'utf-8');
  return JSON.parse(raw);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const leadsFile = process.argv[2];
  if (!leadsFile) {
    console.error('Usage: node scripts/send-whatsapp.mjs <leads-file.json> [--messages <file>] [--auto] [--limit <n>]');
    process.exit(1);
  }

  const flags = parseFlags(process.argv);
  const customMessages = await loadCustomMessages(flags.messagesFile);

  // Load leads
  const leadsPath = resolve(leadsFile);
  const leads = JSON.parse(await readFile(leadsPath, 'utf-8'));
  console.log(`\nLoaded ${leads.length} leads from ${leadsFile}`);

  // Filter: mobile numbers only
  const mobileleads = leads.filter((l) => {
    const phone = l.phone_normalized || normalizeIndianPhone(l.phone);
    return phone && isMobileNumber(phone);
  });
  console.log(`Mobile numbers: ${mobileleads.length}/${leads.length}`);

  // Dedup against sent log
  const sentLog = await loadSentLog();
  const sentPhones = new Set(sentLog.map((e) => e.phone));
  const toSend = mobileleads.filter((l) => {
    const phone = l.phone_normalized || normalizeIndianPhone(l.phone);
    return !sentPhones.has(phone);
  });

  console.log(`Skipped (sent-log): ${mobileleads.length - toSend.length}`);

  if (toSend.length === 0) {
    console.log('All leads already contacted. Nothing to send.');
    process.exit(0);
  }

  // Apply daily limit
  const capped = toSend.slice(0, flags.limit);
  if (capped.length < toSend.length) {
    console.log(`Daily limit: sending ${capped.length}/${toSend.length} (--limit ${flags.limit})`);
  }

  // Connect to WhatsApp first (needed to check existing chats)
  console.log('\nConnecting to WhatsApp...');
  await mkdir(SESSION_DIR, { recursive: true });
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

  const { version } = await fetchLatestWaWebVersion({});
  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
  });

  sock.ev.on('creds.update', saveCreds);

  // Wait for connection
  await new Promise((resolve, reject) => {
    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      if (qr) {
        qrcode.generate(qr, { small: true });
        console.log('\nScan the QR code above with WhatsApp to link this device.\n');
      }
      if (connection === 'open') {
        console.log('WhatsApp connected!\n');
        resolve();
      }
      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        if (statusCode === DisconnectReason.loggedOut) {
          console.error('Logged out. Delete outreach/.wa-session/ and try again.');
          reject(new Error('logged out'));
        } else {
          console.error('Connection closed unexpectedly:', statusCode);
          reject(new Error('connection closed'));
        }
      }
    });
  });

  // Check existing chat history — skip numbers we've already messaged on WhatsApp
  console.log('Checking existing WhatsApp chats...');
  const newLeads = [];
  const skippedChat = [];

  for (const lead of capped) {
    const phone = lead.phone_normalized || normalizeIndianPhone(lead.phone);
    const jid = phoneToJid(phone);
    try {
      const [msg] = await sock.fetchMessages(jid, 1);
      if (msg) {
        skippedChat.push(lead.name);
        continue;
      }
    } catch {
      // fetchMessages may not be supported or chat doesn't exist — treat as new
    }
    newLeads.push(lead);
  }

  if (skippedChat.length > 0) {
    console.log(`Skipped (existing chat): ${skippedChat.length} — ${skippedChat.join(', ')}`);
  }

  if (newLeads.length === 0) {
    console.log('All leads already have existing chats. Nothing to send.');
    sock.end();
    process.exit(0);
  }

  console.log(`\nReady to send: ${newLeads.length} messages\n`);

  // Resolve message for each lead (custom or template)
  const resolvedMessages = newLeads.map((lead) => {
    const phone = lead.phone_normalized || normalizeIndianPhone(lead.phone);
    if (customMessages && customMessages[phone]) {
      return { message: customMessages[phone], source: 'ai' };
    }
    const { whatsapp } = generateMessages(lead);
    return { message: whatsapp, source: 'template' };
  });

  // Preview messages
  for (let i = 0; i < newLeads.length; i++) {
    const lead = newLeads[i];
    const phone = lead.phone_normalized || normalizeIndianPhone(lead.phone);
    const { message, source } = resolvedMessages[i];
    console.log(`--- ${i + 1}. ${lead.name} (${phone}) [${source}] ---`);
    console.log(message);
    console.log('');
  }

  // Confirm (skip if --auto)
  if (!flags.auto) {
    const readline = await import('readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise((r) => rl.question('Send all? (yes/no): ', r));
    rl.close();

    if (answer.trim().toLowerCase() !== 'yes') {
      console.log('Aborted.');
      sock.end();
      process.exit(0);
    }
  } else {
    console.log('--auto mode: skipping confirmation\n');
  }

  // Send messages
  let sent = 0;
  let failed = 0;
  let consecutiveFailures = 0;

  for (let i = 0; i < newLeads.length; i++) {
    const lead = newLeads[i];
    const phone = lead.phone_normalized || normalizeIndianPhone(lead.phone);
    const { message, source } = resolvedMessages[i];
    const jid = phoneToJid(phone);

    try {
      await sock.sendMessage(jid, { text: message });
      sent++;
      consecutiveFailures = 0;
      console.log(`✓ [${sent}/${newLeads.length}] Sent to ${lead.name} (${phone})`);

      await appendSentLog({
        phone,
        name: lead.name,
        category: lead.category,
        city: lead.city,
        sentAt: new Date().toISOString(),
        leadsFile,
        messageSource: source,
        messageSent: message,
      });

      // Random delay between messages (skip after last)
      if (i < newLeads.length - 1) {
        const delayMs = randomDelay();
        console.log(`  Waiting ${(delayMs / 1000).toFixed(1)}s...`);
        await delay(delayMs);
      }
    } catch (err) {
      failed++;
      consecutiveFailures++;
      console.error(`✗ Failed: ${lead.name} (${phone}) — ${err.message}`);

      // Circuit breaker: stop after 2 consecutive failures
      if (consecutiveFailures >= 2) {
        console.error('\n⚠ 2 consecutive failures — stopping to avoid WhatsApp throttling.');
        console.error('Try again later or check your WhatsApp connection.');
        break;
      }
    }
  }

  console.log(`\nDone! Sent: ${sent}, Failed: ${failed}`);
  console.log(`Log: ${SENT_LOG_PATH}`);

  // Graceful disconnect
  await delay(2000);
  sock.end();
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
