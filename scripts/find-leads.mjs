#!/usr/bin/env node
/**
 * MemberBook Lead Finder
 * Searches Google Maps Places API for gyms/libraries/tuition centers
 * in Indian cities and generates outreach-ready CSV + message drafts.
 *
 * Usage:
 *   node scripts/find-leads.mjs --city "Pune" --category gym --limit 25
 *   node scripts/find-leads.mjs --city "Delhi" --area "Laxmi Nagar" --category tuition
 *   node scripts/find-leads.mjs --input outreach/raw.json --messages-only
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { normalizeIndianPhone, buildWhatsAppLink } from './lib/phone.mjs';
import { generateCsv, LEAD_CSV_HEADERS } from './lib/csv-writer.mjs';
import { generateMessages, formatMessagesMarkdown, inferScale } from './lib/messages.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── Load .env ─────────────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = join(ROOT, '.env');
  if (!existsSync(envPath)) return {};
  const env = {};
  for (const line of readFileSync(envPath, 'utf8').replace(/\r/g, '').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

// ── CLI parsing ───────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = { city: '', area: '', category: 'gym', limit: 25, input: '', messagesOnly: false, apiKey: '' };
  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case '--city': args.city = argv[++i] || ''; break;
      case '--area': args.area = argv[++i] || ''; break;
      case '--category': args.category = argv[++i] || 'gym'; break;
      case '--limit': args.limit = parseInt(argv[++i], 10) || 25; break;
      case '--input': args.input = argv[++i] || ''; break;
      case '--messages-only': args.messagesOnly = true; break;
      case '--api-key': args.apiKey = argv[++i] || ''; break;
      case '--help': case '-h':
        console.log(`
MemberBook Lead Finder

Usage:
  node scripts/find-leads.mjs --city <city> --category <category> [options]
  node scripts/find-leads.mjs --input <raw.json> --messages-only

Options:
  --city <name>        City to search (e.g., "Pune", "Delhi")
  --area <name>        Narrow to a specific area (e.g., "Laxmi Nagar")
  --category <type>    gym | library | tuition (default: gym)
  --limit <n>          Max leads to fetch (default: 25, max ~60)
  --input <path>       Path to existing raw.json for re-processing
  --messages-only      Skip API calls, regenerate messages from raw.json
  --api-key <key>      Google Maps API key (or set GOOGLE_MAPS_API_KEY in .env)
  --help               Show this help
`);
        process.exit(0);
    }
  }
  return args;
}

// ── Google Maps API ───────────────────────────────────────────────────────────

const CATEGORY_QUERIES = {
  gym: 'gym fitness center',
  library: 'library reading room',
  tuition: 'tuition center coaching classes',
};

async function searchPlaces(apiKey, query, city, area, limit) {
  const leads = [];
  let nextPageToken = null;

  const locationQuery = area ? `${query} in ${area}, ${city}` : `${query} in ${city}`;
  console.log(`Searching: "${locationQuery}" (limit: ${limit})`);

  do {
    const params = new URLSearchParams({ query: locationQuery, key: apiKey });
    if (nextPageToken) params.set('pagetoken', nextPageToken);

    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      if (data.status === 'REQUEST_DENIED') {
        console.error(`API error: ${data.error_message || data.status}`);
        console.error('Check that your GOOGLE_MAPS_API_KEY is valid and has Places API enabled.');
        process.exit(1);
      }
      console.error(`API status: ${data.status} — ${data.error_message || ''}`);
      break;
    }

    for (const place of (data.results || [])) {
      if (leads.length >= limit) break;
      leads.push({
        place_id: place.place_id,
        name: place.name,
        address: place.formatted_address,
        rating: place.rating || null,
        reviews: place.user_ratings_total || 0,
        lat: place.geometry?.location?.lat,
        lng: place.geometry?.location?.lng,
      });
    }

    nextPageToken = data.next_page_token || null;

    if (nextPageToken && leads.length < limit) {
      // Google requires ~2s before next_page_token becomes valid
      console.log(`  Fetched ${leads.length}/${limit} leads, waiting for next page...`);
      await sleep(2500);
    }
  } while (nextPageToken && leads.length < limit);

  return leads;
}

async function getPlaceDetails(apiKey, placeId) {
  const fields = 'formatted_phone_number,international_phone_number,website,url,opening_hours';
  const params = new URLSearchParams({ place_id: placeId, fields, key: apiKey });
  const url = `https://maps.googleapis.com/maps/api/place/details/json?${params}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.result || {};
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Lead enrichment ───────────────────────────────────────────────────────────

async function enrichLeads(apiKey, rawLeads, category, city) {
  const enriched = [];
  console.log(`\nEnriching ${rawLeads.length} leads with Place Details...`);

  for (let i = 0; i < rawLeads.length; i++) {
    const lead = rawLeads[i];
    process.stdout.write(`  [${i + 1}/${rawLeads.length}] ${lead.name}...`);

    try {
      const details = await getPlaceDetails(apiKey, lead.place_id);
      const phone = details.international_phone_number || details.formatted_phone_number || '';
      const normalized = normalizeIndianPhone(phone);
      const scale = inferScale(lead.reviews);

      enriched.push({
        ...lead,
        phone,
        phone_normalized: normalized,
        website: details.website || '',
        google_maps_url: details.url || '',
        category,
        city,
        scale,
      });
      console.log(` ${normalized || 'no phone'}`);
    } catch (err) {
      console.log(` error: ${err.message}`);
      enriched.push({ ...lead, phone: '', phone_normalized: '', website: '', google_maps_url: '', category, city, scale: inferScale(lead.reviews) });
    }

    // Rate limit: avoid hitting API too fast
    if (i < rawLeads.length - 1) await sleep(200);
  }

  return enriched;
}

// ── Output ────────────────────────────────────────────────────────────────────

function writeOutputs(leads, outputDir) {
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

  // raw.json
  const rawPath = join(outputDir, 'raw.json');
  writeFileSync(rawPath, JSON.stringify(leads, null, 2));
  console.log(`  raw.json      — ${leads.length} leads`);

  // leads.csv
  const csvRows = leads.map((l) => ({
    ...l,
    whatsapp_link: l.phone ? buildWhatsAppLink(l.phone, '') : '',
  }));
  const csv = generateCsv(LEAD_CSV_HEADERS, csvRows);
  const csvPath = join(outputDir, 'leads.csv');
  writeFileSync(csvPath, csv);
  console.log(`  leads.csv     — spreadsheet-ready`);

  // messages.md
  const md = formatMessagesMarkdown(leads);
  const mdPath = join(outputDir, 'messages.md');
  writeFileSync(mdPath, md);
  console.log(`  messages.md   — draft outreach messages`);

  return { rawPath, csvPath, mdPath };
}

function printSummary(leads, outputDir) {
  console.log('\n' + '='.repeat(60));
  console.log(' LEAD SUMMARY');
  console.log('='.repeat(60));

  const withPhone = leads.filter((l) => l.phone_normalized);
  const withWebsite = leads.filter((l) => l.website);
  const scales = { new: 0, growing: 0, established: 0 };
  leads.forEach((l) => { scales[l.scale || 'new']++; });

  console.log(`  Total leads:      ${leads.length}`);
  console.log(`  With phone:       ${withPhone.length}`);
  console.log(`  With website:     ${withWebsite.length}`);
  console.log(`  Scale breakdown:  ${scales.new} new / ${scales.growing} growing / ${scales.established} established`);
  console.log('');

  // Top leads table
  console.log('  #  Name                             Phone            Rating  Reviews');
  console.log('  ' + '-'.repeat(75));
  for (let i = 0; i < Math.min(leads.length, 15); i++) {
    const l = leads[i];
    const name = (l.name || '').slice(0, 32).padEnd(32);
    const phone = (l.phone_normalized || 'N/A').padEnd(16);
    const rating = (l.rating ? l.rating.toFixed(1) : 'N/A').padEnd(7);
    console.log(`  ${String(i + 1).padStart(2)}  ${name} ${phone} ${rating} ${l.reviews || 0}`);
  }
  if (leads.length > 15) console.log(`  ... and ${leads.length - 15} more`);

  console.log('\n' + '='.repeat(60));
  console.log(' NEXT STEPS');
  console.log('='.repeat(60));
  console.log(`  1. Review messages:  open ${join(outputDir, 'messages.md')}`);
  console.log(`  2. Edit as needed — personalize before sending`);
  console.log(`  3. Open WhatsApp links from the CSV to send messages`);
  console.log(`  4. Track responses in a spreadsheet or CRM`);
  console.log('');
  console.log('  REMINDER: Never send messages without personal review!');
  console.log('='.repeat(60) + '\n');
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv);
  const env = loadEnv();
  const apiKey = args.apiKey || env.GOOGLE_MAPS_API_KEY || '';

  console.log('MemberBook Lead Finder\n');

  // Mode: regenerate messages from existing raw.json
  if (args.input || args.messagesOnly) {
    const inputPath = args.input;
    if (!inputPath || !existsSync(inputPath)) {
      console.error('Error: --input file not found: ' + (inputPath || '(none)'));
      process.exit(1);
    }

    console.log(`Loading leads from ${inputPath}...`);
    const leads = JSON.parse(readFileSync(inputPath, 'utf8'));
    const outputDir = dirname(inputPath);

    console.log(`Regenerating outputs for ${leads.length} leads...\n`);
    writeOutputs(leads, outputDir);
    printSummary(leads, outputDir);
    return;
  }

  // Mode: search Google Maps
  if (!args.city) {
    console.error('Error: --city is required (e.g., --city "Pune")');
    process.exit(1);
  }

  if (!apiKey) {
    console.error('Error: Google Maps API key required.');
    console.error('Set GOOGLE_MAPS_API_KEY in .env or pass --api-key <key>');
    process.exit(1);
  }

  const category = args.category;
  const query = CATEGORY_QUERIES[category];
  if (!query) {
    console.error(`Error: Unknown category "${category}". Use: gym, library, or tuition`);
    process.exit(1);
  }

  // Search
  const rawLeads = await searchPlaces(apiKey, query, args.city, args.area, args.limit);
  if (rawLeads.length === 0) {
    console.log('No leads found. Try a different city or category.');
    process.exit(0);
  }

  // Enrich with Place Details
  const leads = await enrichLeads(apiKey, rawLeads, category, args.city);

  // Write output
  const date = new Date().toISOString().slice(0, 10);
  const slug = `${date}-${args.city.toLowerCase().replace(/\s+/g, '-')}-${category}`;
  const outputDir = join(ROOT, 'outreach', slug);

  console.log(`\nWriting output to outreach/${slug}/`);
  writeOutputs(leads, outputDir);
  printSummary(leads, outputDir);
}

main().catch((err) => {
  console.error('\nError:', err.stack || err.message);
  process.exit(1);
});
