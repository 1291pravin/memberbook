#!/usr/bin/env node
/**
 * Work the add-on service queue (websites, review replies, review summaries)
 * through the admin API. Used by the hourly delivery routine
 * (see docs/service-delivery.md).
 *
 * Env: MEMBERBOOK_SERVICES_TOKEN (or MEMBERBOOK_ADMIN_TOKEN), MEMBERBOOK_URL (default https://memberbook.in)
 *
 *   node scripts/services.mjs list [status]                 List requests (default: new)
 *   node scripts/services.mjs show <id>                     Everything needed for one request
 *   node scripts/services.mjs claim <id>                    Mark as working (do this first)
 *   node scripts/services.mjs download <id> <dir>           Save the website's logo and photos into <dir>
 *   node scripts/services.mjs deliver-site <id> <html> [summary...]  Hand in a website page (goes to admin review)
 *   node scripts/services.mjs deliver-text <id> <file>      Hand in a review reply or summary (goes to the owner)
 *   node scripts/services.mjs fail <id> <message>           Give up, with a message the owner sees
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const base = (process.env.MEMBERBOOK_URL || "https://memberbook.in").replace(/\/$/, "");
// The AI task uses its narrow worker token; the master admin token also works.
const token = process.env.MEMBERBOOK_SERVICES_TOKEN || process.env.MEMBERBOOK_ADMIN_TOKEN;
if (!token) {
  console.error("Set MEMBERBOOK_SERVICES_TOKEN (or MEMBERBOOK_ADMIN_TOKEN)");
  process.exit(1);
}

async function call(method, url, body) {
  const res = await fetch(`${base}${url}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let detail = await res.text();
    try {
      detail = JSON.parse(detail).statusMessage || detail;
    }
    catch {
      // not JSON, keep the raw text
    }
    throw new Error(`${method} ${url} failed (${res.status}): ${detail}`);
  }
  return res;
}

const [cmd, a, b] = process.argv.slice(2);
try {
  switch (cmd) {
    case "list": {
      const rows = await (await call("GET", `/api/admin/service-requests?status=${encodeURIComponent(a || "new")}`)).json();
      console.log(JSON.stringify(rows.map(({ input, ...r }) => ({ ...r, input: { ...input, text: input.text ? `${String(input.text).slice(0, 80)}…` : undefined } })), null, 2));
      break;
    }
    case "show":
      console.log(JSON.stringify(await (await call("GET", `/api/admin/service-requests/${a}`)).json(), null, 2));
      break;
    case "claim":
      await call("POST", `/api/admin/service-requests/${a}/claim`);
      console.log(`Claimed request ${a}`);
      break;
    case "download": {
      if (!b) throw new Error("Usage: download <id> <dir>");
      const info = await (await call("GET", `/api/admin/service-requests/${a}`)).json();
      await mkdir(b, { recursive: true });
      for (const f of info.website?.files ?? []) {
        const res = await call("GET", `/api/admin/service-requests/${a}/files/${f.index}`);
        const ext = (f.type.split("/")[1] || "img").replace("svg+xml", "svg").replace("jpeg", "jpg");
        const file = path.join(b, `${f.index}-${f.kind}.${ext}`);
        await writeFile(file, Buffer.from(await res.arrayBuffer()));
        console.log(`${file}  (use src="${f.src}")`);
      }
      if (info.website?.currentHtml) {
        await writeFile(path.join(b, "current.html"), info.website.currentHtml);
        console.log(path.join(b, "current.html"));
      }
      break;
    }
    case "deliver-site": {
      if (!b) throw new Error("Usage: deliver-site <id> <html-file> [summary]");
      const html = await readFile(b, "utf8");
      const summary = process.argv.slice(5).join(" ");
      console.log(JSON.stringify(await (await call("POST", `/api/admin/service-requests/${a}/deliver`, { html, summary })).json()));
      break;
    }
    case "deliver-text": {
      if (!b) throw new Error("Usage: deliver-text <id> <text-file>");
      const text = await readFile(b, "utf8");
      console.log(JSON.stringify(await (await call("POST", `/api/admin/service-requests/${a}/deliver`, { text })).json()));
      break;
    }
    case "fail":
      if (!b) throw new Error("Usage: fail <id> <message>");
      await call("POST", `/api/admin/service-requests/${a}/fail`, { message: process.argv.slice(4).join(" ") });
      console.log(`Marked request ${a} as failed`);
      break;
    default:
      console.error("Commands: list, show, claim, download, deliver-site, deliver-text, fail (see the top of this file)");
      process.exit(1);
  }
}
catch (err) {
  console.error(err.message);
  process.exit(1);
}
