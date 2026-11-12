#!/usr/bin/env node
/**
 * Work the data-upload queue through the admin API. Used by the hourly AI
 * loading routine (see docs/upload-loading.md).
 *
 * Env: MEMBERBOOK_ADMIN_TOKEN (required), MEMBERBOOK_URL (default https://memberbook.in)
 *
 *   node scripts/uploads.mjs list [status]        List uploads (default: pending)
 *   node scripts/uploads.mjs show <id>            Upload details: pasted text, files, existing plans, today
 *   node scripts/uploads.mjs claim <id>           Mark as processing (do this before reading)
 *   node scripts/uploads.mjs download <id> <dir>  Save the upload's files into <dir>
 *   node scripts/uploads.mjs load <id> <json>     Load { plans, members, skipped, upiId } from a JSON file
 *   node scripts/uploads.mjs fail <id> <message>  Give up, with a message the owner sees
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const base = (process.env.MEMBERBOOK_URL || "https://memberbook.in").replace(/\/$/, "");
const token = process.env.MEMBERBOOK_ADMIN_TOKEN;
if (!token) {
  console.error("Set MEMBERBOOK_ADMIN_TOKEN");
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
      const rows = await (await call("GET", `/api/admin/uploads?status=${encodeURIComponent(a || "pending")}`)).json();
      console.log(JSON.stringify(rows, null, 2));
      break;
    }
    case "show":
      console.log(JSON.stringify(await (await call("GET", `/api/admin/uploads/${a}`)).json(), null, 2));
      break;
    case "claim":
      await call("POST", `/api/admin/uploads/${a}/claim`);
      console.log(`Claimed upload ${a}`);
      break;
    case "download": {
      if (!b) throw new Error("Usage: download <id> <dir>");
      const info = await (await call("GET", `/api/admin/uploads/${a}`)).json();
      await mkdir(b, { recursive: true });
      for (const f of info.files) {
        const res = await call("GET", `/api/admin/uploads/${a}/files/${f.index}`);
        const name = `${f.index}-${path.basename(f.name).replace(/[^\w.\- ]+/g, "_")}`;
        await writeFile(path.join(b, name), Buffer.from(await res.arrayBuffer()));
        console.log(path.join(b, name));
      }
      if (info.text) {
        await writeFile(path.join(b, "pasted.txt"), info.text);
        console.log(path.join(b, "pasted.txt"));
      }
      break;
    }
    case "load": {
      if (!b) throw new Error("Usage: load <id> <json-file>");
      const data = JSON.parse(await readFile(b, "utf8"));
      const members = data.members ?? [];
      const chunk = 200;
      let last;
      // Big lists go in several calls; the server adds them into one report.
      for (let i = 0; i === 0 || i < members.length; i += chunk) {
        const final = i + chunk >= members.length;
        last = await (await call("POST", `/api/admin/uploads/${a}/load`, {
          plans: i === 0 ? data.plans ?? [] : [],
          members: members.slice(i, i + chunk),
          skipped: i === 0 ? data.skipped ?? [] : [],
          upiId: i === 0 ? data.upiId : undefined,
          final,
        })).json();
      }
      console.log(JSON.stringify(last, null, 2));
      break;
    }
    case "fail":
      if (!b) throw new Error("Usage: fail <id> <message>");
      await call("POST", `/api/admin/uploads/${a}/fail`, { message: process.argv.slice(4).join(" ") });
      console.log(`Marked upload ${a} as failed`);
      break;
    default:
      console.error("Commands: list, show, claim, download, load, fail (see the top of this file)");
      process.exit(1);
  }
}
catch (err) {
  console.error(err.message);
  process.exit(1);
}
