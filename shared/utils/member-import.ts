/**
 * Turns whatever an owner has (a CSV export, rows copied from Excel or Google
 * Sheets, or a plain "Amit 9876543210" list typed or copied from WhatsApp) into
 * rows the member import endpoint accepts.
 *
 * The goal is to import as much as possible: only a missing name blocks a row.
 * Anything else that can't be understood (a bad phone, an unknown plan, an
 * odd date) is dropped from that row with a warning, and kept in the notes.
 */
import { normalizePhone } from "./phone";

export type ImportField =
  | "name" | "phone" | "email" | "status" | "notes" | "fatherName" | "address"
  | "batch" | "plan" | "startDate" | "amountPaid" | "paymentMethod";

export interface ImportMember {
  name: string;
  phone?: string;
  email?: string;
  status?: "active" | "inactive";
  notes?: string;
  fatherName?: string;
  address?: string;
  batch?: string;
  plan?: string;
  startDate?: string;
  amountPaid?: number;
  paymentMethod?: "cash" | "upi" | "card" | "bank_transfer";
}

export interface ImportPreviewRow {
  /** 1-based line in what the owner gave us, for messages. */
  line: number;
  member: ImportMember;
  error: string | null;
  warnings: string[];
}

export interface ParsedImport {
  rows: ImportPreviewRow[];
  /** Which input column fed each field, for showing "we read X as Y". */
  columns: Partial<Record<ImportField, string>>;
  hasHeader: boolean;
}

// Header spellings seen in Indian gym, library and coaching registers.
const FIELD_ALIASES: Record<ImportField, string[]> = {
  name: ["name", "member name", "membername", "full name", "fullname", "student name", "student", "member", "client name", "customer name", "candidate name", "naam"],
  phone: ["phone", "phone no", "phone number", "mobile", "mobile no", "mobile number", "mob", "mob no", "contact", "contact no", "contact number", "whatsapp", "whatsapp no", "whatsapp number", "cell", "number", "ph", "ph no"],
  email: ["email", "e-mail", "email id", "mail", "email address"],
  status: ["status", "active"],
  notes: ["notes", "note", "remarks", "remark", "comments", "comment", "details"],
  fatherName: ["fathername", "father name", "father's name", "fathers name", "father", "guardian", "guardian name", "parent", "parent name"],
  address: ["address", "addr", "location", "area", "city"],
  batch: ["batch", "shift", "timing", "time", "slot", "seat", "seat no", "class", "course"],
  plan: ["plan", "plan name", "package", "membership", "membership type", "subscription", "plan type", "package name", "duration"],
  startDate: ["startdate", "start date", "start", "joining date", "date of joining", "doj", "join date", "joined", "joined on", "admission date", "date", "from", "from date", "renewal date", "paid on", "payment date"],
  amountPaid: ["amountpaid", "amount paid", "amount", "paid", "fees", "fee", "fees paid", "fee paid", "paid amount", "payment", "rs", "price"],
  paymentMethod: ["paymentmethod", "payment method", "method", "mode", "payment mode", "paid by", "paid via"],
};

function normHeader(h: string): string {
  return h.toLowerCase().replace(/[_.:#*]/g, " ").replace(/\s+/g, " ").trim();
}

const ALIAS_LOOKUP = new Map<string, ImportField>();
for (const [field, aliases] of Object.entries(FIELD_ALIASES) as [ImportField, string[]][]) {
  for (const alias of aliases) ALIAS_LOOKUP.set(normHeader(alias), field);
}

export function matchHeader(header: string): ImportField | null {
  const h = normHeader(header);
  if (!h) return null;
  if (ALIAS_LOOKUP.has(h)) return ALIAS_LOOKUP.get(h)!;
  // "Mobile No." / "Member's Name" / "Fees (₹)"
  const stripped = h.replace(/\(.*?\)/g, "").replace(/'s\b/g, "").replace(/[^a-z ]/g, "").replace(/\s+/g, " ").trim();
  return ALIAS_LOOKUP.get(stripped) ?? null;
}

/** Split text into rows of cells. Detects tab (pasted from Excel), comma, or semicolon. */
export function splitRows(text: string): string[][] {
  const cleaned = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const lines = cleaned.split("\n").filter(l => l.trim());
  if (!lines.length) return [];

  const sample = lines.slice(0, 10);
  const count = (ch: string) => sample.reduce((n, l) => n + (l.split(ch).length - 1), 0);
  const tabs = count("\t");
  const commas = count(",");
  const semis = count(";");

  let delimiter: string | null = null;
  if (tabs > 0 && tabs >= commas / 2) delimiter = "\t";
  else if (commas > 0 && commas >= semis) delimiter = ",";
  else if (semis > 0) delimiter = ";";

  if (!delimiter) {
    // A plain list: "Amit Sharma 9876543210" or "Amit Sharma - 98765 43210"
    return lines.map(splitFreeText);
  }
  return parseDelimited(cleaned, delimiter).filter(r => r.some(c => c.trim()));
}

function parseDelimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (inQuotes) {
      if (ch === "\"") {
        if (text[i + 1] === "\"") { cell += "\""; i++; }
        else inQuotes = false;
      }
      else cell += ch;
    }
    else if (ch === "\"" && cell.trim() === "") { cell = ""; inQuotes = true; }
    else if (ch === delimiter) { row.push(cell); cell = ""; }
    else if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

const PHONE_IN_TEXT = /(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b|(?:\+?91[\s-]?)?[6-9]\d{9}\b/;

/** "1. Amit Sharma - 98765 43210 (morning)" -> ["Amit Sharma", "98765 43210", "morning"] */
function splitFreeText(line: string): string[] {
  let rest = line.trim().replace(/^\s*(?:\d+[.)]|[-*•])\s+/, "");
  const match = rest.match(PHONE_IN_TEXT);
  if (!match) return [rest.replace(/[\s,:\-–]+$/, "")];
  const phone = match[0];
  const before = rest.slice(0, match.index).replace(/[\s,:\-–|]+$/, "").trim();
  const after = rest.slice(match.index! + phone.length).replace(/^[\s,:\-–|]+/, "").replace(/^\((.*)\)$/, "$1").trim();
  rest = before;
  return after ? [rest, phone, after] : [rest, phone];
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

function monthNumber(word: string): number | null {
  return MONTHS[word.slice(0, 4)] ?? MONTHS[word.slice(0, 3)] ?? null;
}

function pad(n: number) { return String(n).padStart(2, "0"); }

function validYmd(y: number, m: number, d: number): string | null {
  if (y < 100) y += 2000;
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1990 || y > 2100) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCMonth() !== m - 1) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
}

/**
 * Parse the dates people actually write: 2025-01-05, 05/01/2025, 5-1-25,
 * 5.1.2025, 5 Jan 2025, Jan 5 2025. Day comes before month (Indian format).
 * Also accepts Excel serial numbers (e.g. 45658) from copied cells.
 */
export function parseFlexibleDate(raw: string): string | null {
  const s = raw.trim().toLowerCase().replace(/(\d)(st|nd|rd|th)\b/g, "$1").replace(/,/g, " ");
  if (!s) return null;
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return validYmd(+m[1]!, +m[2]!, +m[3]!);
  m = s.match(/^(\d{1,2})[-/.\s](\d{1,2})[-/.\s](\d{2}|\d{4})$/);
  if (m) return validYmd(+m[3]!, +m[2]!, +m[1]!);
  m = s.match(/^(\d{1,2})[-/.\s]+([a-z]{3,9})[-/.\s]+(\d{2}|\d{4})$/);
  if (m && monthNumber(m[2]!)) return validYmd(+m[3]!, monthNumber(m[2]!)!, +m[1]!);
  m = s.match(/^([a-z]{3,9})[-/.\s]+(\d{1,2})[-/.\s]+(\d{2}|\d{4})$/);
  if (m && monthNumber(m[1]!)) return validYmd(+m[3]!, monthNumber(m[1]!)!, +m[2]!);
  m = s.match(/^(\d{5})$/);
  if (m) {
    const serial = +m[1]!;
    if (serial > 32000 && serial < 80000) {
      const dt = new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
      return dt.toISOString().slice(0, 10);
    }
  }
  return null;
}

export function parseAmount(raw: string): number | null {
  const s = raw.replace(/₹|rs\.?|inr|\/-|,|\s/gi, "");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function parsePaymentMethod(raw: string): ImportMember["paymentMethod"] | null {
  const s = raw.toLowerCase().replace(/[^a-z]/g, "");
  if (!s) return null;
  if (s.includes("cash")) return "cash";
  if (["upi", "gpay", "googlepay", "phonepe", "paytm", "bhim", "qr", "online"].some(k => s.includes(k))) return "upi";
  if (s.includes("card") || s.includes("debit") || s.includes("credit")) return "card";
  if (["bank", "neft", "imps", "rtgs", "transfer", "cheque", "check"].some(k => s.includes(k))) return "bank_transfer";
  return null;
}

function looksLikeHeaderRow(cells: string[]): boolean {
  const matched = cells.filter(c => matchHeader(c)).length;
  const hasData = cells.some(c => normalizePhone(c) || parseFlexibleDate(c) || /\d{3,}/.test(c));
  return matched >= 1 && (matched >= cells.filter(c => c.trim()).length / 2 || !hasData);
}

/** Guess columns for a sheet without headers: a phone-looking column, a date column, the first text column is the name. */
function guessColumns(rows: string[][]): Map<number, ImportField> {
  const width = Math.max(...rows.map(r => r.length));
  const sample = rows.slice(0, 20);
  const map = new Map<number, ImportField>();
  const share = (i: number, test: (v: string) => boolean) => {
    const vals = sample.map(r => (r[i] ?? "").trim()).filter(Boolean);
    return vals.length ? vals.filter(test).length / vals.length : 0;
  };
  const used = new Set<ImportField>();
  for (let i = 0; i < width; i++) {
    if (!used.has("phone") && share(i, v => !!normalizePhone(v)) >= 0.6) { map.set(i, "phone"); used.add("phone"); continue; }
    if (!used.has("email") && share(i, v => /^\S+@\S+\.\S+$/.test(v)) >= 0.6) { map.set(i, "email"); used.add("email"); continue; }
    if (!used.has("startDate") && share(i, v => !!parseFlexibleDate(v) && !/^\d+$/.test(v)) >= 0.6) { map.set(i, "startDate"); used.add("startDate"); continue; }
    if (!used.has("amountPaid") && share(i, v => /^(₹|rs\.?)?\s*\d[\d,]*(\.\d+)?\s*(\/-)?$/i.test(v)) >= 0.6) { map.set(i, "amountPaid"); used.add("amountPaid"); continue; }
    if (!used.has("name") && share(i, v => /\p{L}/u.test(v)) >= 0.6) { map.set(i, "name"); used.add("name"); continue; }
  }
  // Remaining text columns become notes.
  for (let i = 0; i < width; i++) {
    if (!map.has(i) && share(i, v => !!v) > 0) map.set(i, "notes");
  }
  return map;
}

export interface ParseOptions {
  /** Plan names that exist in the workspace (any case). */
  planNames: string[];
  /** Plan prices in paise, keyed by lower-case plan name. Amounts above the price are kept in notes. */
  planPrices?: Record<string, number>;
}

export function parseMemberImport(text: string, options: ParseOptions): ParsedImport {
  const table = splitRows(text);
  if (!table.length) return { rows: [], columns: {}, hasHeader: false };

  const hasHeader = looksLikeHeaderRow(table[0]!);
  const columnMap = new Map<number, ImportField>();
  const columns: Partial<Record<ImportField, string>> = {};
  const extraNoteColumns: { index: number; label: string }[] = [];

  if (hasHeader) {
    table[0]!.forEach((h, i) => {
      const field = matchHeader(h);
      if (field && !Object.values(Object.fromEntries(columnMap)).includes(field)) {
        columnMap.set(i, field);
        columns[field] = h.trim();
      }
      else if (h.trim()) {
        extraNoteColumns.push({ index: i, label: h.trim() });
      }
    });
    // No name column but there's an unrecognised first column: assume it's the name.
    if (![...columnMap.values()].includes("name")) {
      const guessed = guessColumns(table.slice(1));
      for (const [i, f] of guessed) {
        if (f === "name" && !columnMap.has(i)) {
          columnMap.set(i, "name");
          columns.name = table[0]![i]?.trim() || "column " + (i + 1);
          const idx = extraNoteColumns.findIndex(c => c.index === i);
          if (idx >= 0) extraNoteColumns.splice(idx, 1);
          break;
        }
      }
    }
  }
  else {
    for (const [i, f] of guessColumns(table)) {
      if (f === "notes") extraNoteColumns.push({ index: i, label: "" });
      else { columnMap.set(i, f); columns[f] = `column ${i + 1}`; }
    }
  }

  const plans = new Map(options.planNames.map(p => [p.toLowerCase().trim(), p]));
  const dataRows = hasHeader ? table.slice(1) : table;

  const rows = dataRows.map((cells, idx): ImportPreviewRow => {
    const line = idx + (hasHeader ? 2 : 1);
    const raw: Partial<Record<ImportField, string>> = {};
    for (const [i, f] of columnMap) raw[f] = (cells[i] ?? "").trim();

    const warnings: string[] = [];
    const notes: string[] = [];
    if (raw.notes) notes.push(raw.notes);
    for (const { index, label } of extraNoteColumns) {
      const v = (cells[index] ?? "").trim();
      if (v) notes.push(label ? `${label}: ${v}` : v);
    }

    const member: ImportMember = { name: (raw.name ?? "").replace(/\s+/g, " ") };

    if (raw.phone) {
      const phone = normalizePhone(raw.phone);
      if (phone) member.phone = phone;
      else { warnings.push(`Phone "${raw.phone}" isn't a 10-digit mobile number, saved in notes`); notes.push(`Phone: ${raw.phone}`); }
    }
    if (raw.email) {
      if (/^\S+@\S+\.\S+$/.test(raw.email)) member.email = raw.email.toLowerCase();
      else notes.push(`Email: ${raw.email}`);
    }
    if (raw.status && /^(inactive|left|no|n|0|closed|expired|stopped|discontinued)$/i.test(raw.status)) {
      member.status = "inactive";
    }
    if (raw.fatherName) member.fatherName = raw.fatherName;
    if (raw.address) member.address = raw.address;
    if (raw.batch) member.batch = raw.batch;

    let startDate: string | null = null;
    if (raw.startDate) {
      startDate = parseFlexibleDate(raw.startDate);
      if (!startDate) { warnings.push(`Couldn't read the date "${raw.startDate}", saved in notes`); notes.push(`Date: ${raw.startDate}`); }
    }

    if (raw.plan) {
      const plan = plans.get(raw.plan.toLowerCase().trim());
      if (!plan) {
        warnings.push(`No plan called "${raw.plan}", added without a plan`);
        notes.push(`Plan: ${raw.plan}`);
      }
      else if (!startDate) {
        warnings.push(`Plan "${plan}" needs a start date, added without a plan`);
        notes.push(`Plan: ${plan}`);
      }
      else {
        member.plan = plan;
        member.startDate = startDate;
      }
    }
    else if (startDate) {
      notes.push(`Joined: ${startDate}`);
    }

    if (raw.amountPaid) {
      const amount = parseAmount(raw.amountPaid);
      if (amount === null) { warnings.push(`Couldn't read the amount "${raw.amountPaid}", saved in notes`); notes.push(`Paid: ${raw.amountPaid}`); }
      else if (member.plan) {
        const price = options.planPrices?.[member.plan.toLowerCase().trim()];
        if (price !== undefined && Math.round(amount * 100) > price) {
          warnings.push(`₹${amount} is more than the "${member.plan}" price, saved in notes`);
          notes.push(`Paid: ₹${amount}`);
        }
        else member.amountPaid = amount;
      }
      else if (amount > 0) notes.push(`Paid: ₹${amount}`);
    }
    if (raw.paymentMethod && member.amountPaid) {
      const method = parsePaymentMethod(raw.paymentMethod);
      if (method) member.paymentMethod = method;
      else notes.push(`Paid by: ${raw.paymentMethod}`);
    }

    if (notes.length) member.notes = notes.join("; ").slice(0, 1000);

    return { line, member, error: member.name ? null : "Name is missing", warnings };
  });

  return { rows, columns, hasHeader };
}

export const IMPORT_TEMPLATE_HEADERS = ["Name", "Phone", "Plan", "Start date", "Amount paid", "Payment method", "Batch", "Father's name", "Address", "Email", "Notes"];
