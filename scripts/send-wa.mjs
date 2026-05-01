#!/usr/bin/env node
/**
 * Generic one-off WhatsApp message sender
 *
 * Usage:
 *   node scripts/send-wa.mjs --to 9820657515 --message "Hello!"
 *   node scripts/send-wa.mjs --to 9820657515 --message-file msg.txt
 *   node scripts/send-wa.mjs --to 9820657515 --message "See attached" --file report.pdf
 *
 * Options:
 *   --to <phone>           Indian mobile number (10 digits or with +91)
 *   --message <text>       Message text (use quotes for multi-word)
 *   --message-file <path>  Read message from a text file (for long/multi-line messages)
 *   --file <path>          Optional file to attach as a document
 */

import { readFile, mkdir } from 'fs/promises';
import { join, resolve, basename } from 'path';
import { fileURLToPath } from 'url';
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  delay,
  fetchLatestWaWebVersion,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const SESSION_DIR = join(ROOT, 'outreach', '.wa-session');

// ── CLI parsing ───────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { to: null, message: null, messageFile: null, file: null };
  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case '--to': args.to = argv[++i]; break;
      case '--message': args.message = argv[++i]; break;
      case '--message-file': args.messageFile = argv[++i]; break;
      case '--file': args.file = argv[++i]; break;
    }
  }
  return args;
}

function normalizePhone(phone) {
  if (!phone) return null;
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) cleaned = '91' + cleaned;
  else if (cleaned.length === 12 && cleaned.startsWith('91')) { /* ok */ }
  else cleaned = '91' + cleaned.slice(-10);
  if (cleaned.length !== 12 || !cleaned.startsWith('91')) return null;
  return cleaned; // e.g. 919820657515
}

function mimeType(filePath) {
  const ext = filePath.split('.').pop().toLowerCase();
  return {
    csv: 'text/csv',
    pdf: 'application/pdf',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    txt: 'text/plain',
  }[ext] || 'application/octet-stream';
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv);

  if (!args.to) {
    console.error('Error: --to <phone> is required');
    console.error('Usage: node scripts/send-wa.mjs --to 9820657515 --message "Hello!"');
    process.exit(1);
  }
  if (!args.message && !args.messageFile) {
    console.error('Error: --message or --message-file is required');
    process.exit(1);
  }

  const phone = normalizePhone(args.to);
  if (!phone) {
    console.error(`Error: Could not parse phone number: ${args.to}`);
    process.exit(1);
  }
  const jid = `${phone}@s.whatsapp.net`;

  const message = args.messageFile
    ? await readFile(resolve(args.messageFile), 'utf-8')
    : args.message;

  const filePath = args.file ? resolve(args.file) : null;

  // ── Connect ──────────────────────────────────────────────────────────────

  console.log('Connecting to WhatsApp...');
  await mkdir(SESSION_DIR, { recursive: true });
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestWaWebVersion({});
  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
  });
  sock.ev.on('creds.update', saveCreds);

  await new Promise((resolve, reject) => {
    sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        qrcode.generate(qr, { small: true });
        console.log('\nScan the QR code above with WhatsApp to link.\n');
      }
      if (connection === 'open') { console.log('Connected!\n'); resolve(); }
      if (connection === 'close') {
        const code = lastDisconnect?.error?.output?.statusCode;
        reject(new Error(code === DisconnectReason.loggedOut
          ? 'Logged out — delete outreach/.wa-session/ and retry'
          : `Connection closed: ${code}`));
      }
    });
  });

  // ── Send message ──────────────────────────────────────────────────────────

  console.log(`Sending message to +${phone}...`);
  await sock.sendMessage(jid, { text: message });
  console.log('✓ Message sent');

  // ── Send file (optional) ──────────────────────────────────────────────────

  if (filePath) {
    await delay(2000);
    console.log(`Sending file: ${basename(filePath)}...`);
    const fileBuffer = await readFile(filePath);
    await sock.sendMessage(jid, {
      document: fileBuffer,
      mimetype: mimeType(filePath),
      fileName: basename(filePath),
    });
    console.log('✓ File sent');
  }

  await delay(2000);
  sock.end();
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
