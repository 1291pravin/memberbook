/**
 * The one branded email layout for every email we send to owners and leads from support@
 * (AI replies, admin replies, new conversations). Same look as the cold email in outreach.ts:
 * cream background, white card, MemberBook logo, teal button, signature and footer.
 *
 * The body is written as simple text so the AI and admins can't break the design:
 * - a blank line starts a new paragraph
 * - lines starting "- " or "1. " become a list
 * - [Label](https://...) is a link; a paragraph that is only [Label](https://...) becomes a teal button
 * - bare https:// links are made clickable
 */

const SITE = "https://memberbook.in";
const UTM = "utm_source=email&utm_medium=email&utm_campaign=support";
const FONT = "font-family:'Plus Jakarta Sans',-apple-system,'Segoe UI',Roboto,Arial,sans-serif";
const INK = "#13232B";
const TEAL = "#0F766E";

/** Our own links get UTM tags so visits from support emails show up in analytics. */
function tagUrl(url: string) {
  if (!/^https:\/\/(www\.)?memberbook\.in(\/|$|\?)/.test(url) || /[?&]utm_/.test(url)) return url;
  return url + (url.includes("?") ? "&" : "?") + UTM;
}

/** Short visible text for a bare link: no https://, no query string. */
function shortUrl(url: string) {
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/[?#].*$/, "").replace(/\/$/, "");
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const LINK_MD = /\[([^\]\n]{1,80})\]\((https?:\/\/[^\s)]+)\)/g;
const BUTTON_MD = /^\[([^\]\n]{1,60})\]\((https?:\/\/[^\s)]+)\)$/;

/** Escape, then turn [label](url) and bare URLs into links. */
function inline(s: string) {
  const parts: string[] = [];
  let last = 0;
  for (const m of s.matchAll(LINK_MD)) {
    parts.push(bareLinks(esc(s.slice(last, m.index))));
    parts.push(`<a href="${esc(tagUrl(m[2]!))}" style="color:${TEAL};font-weight:700;text-decoration:underline">${esc(m[1]!)}</a>`);
    last = m.index! + m[0].length;
  }
  parts.push(bareLinks(esc(s.slice(last))));
  return parts.join("");
}

function bareLinks(escaped: string) {
  return escaped.replace(/\bhttps?:\/\/[^\s<]+[^\s<.,;:!?)]/g, (url) => {
    const raw = url.replace(/&amp;/g, "&");
    return `<a href="${esc(tagUrl(raw))}" style="color:${TEAL};text-decoration:underline;word-break:break-word">${esc(shortUrl(raw))}</a>`;
  });
}

function blockHtml(block: string) {
  const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
  const button = lines.length === 1 ? lines[0]!.match(BUTTON_MD) : null;
  if (button) {
    return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 18px"><tr><td style="border-radius:10px;background:${TEAL}"><a href="${esc(tagUrl(button[2]!))}" style="display:inline-block;padding:13px 22px;${FONT};font-size:16px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:10px">${esc(button[1]!)}</a></td></tr></table>`;
  }
  const isItem = (l: string) => /^(-|\*|•|\d{1,2}[.)])\s+/.test(l);
  const out: string[] = [];
  let para: string[] = [];
  let items: string[] = [];
  let ordered = false;
  const flushPara = () => {
    if (para.length) out.push(`<p style="margin:0 0 16px;${FONT};font-size:16px;line-height:1.6;color:${INK}">${para.map(inline).join("<br>")}</p>`);
    para = [];
  };
  const flushItems = () => {
    if (items.length) {
      const rows = items.map((it, i) => `<tr><td width="28" valign="top" style="padding:5px 0;${FONT};font-size:15px;line-height:1.5;color:${TEAL};font-weight:700">${ordered ? `${i + 1}.` : "&#10003;"}</td><td style="padding:5px 0;${FONT};font-size:15px;line-height:1.5;color:${INK}">${inline(it)}</td></tr>`).join("");
      out.push(`<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 18px;background:#F0FAF8;border-radius:12px;width:100%"><tr><td style="padding:10px 16px"><table role="presentation" cellpadding="0" cellspacing="0">${rows}</table></td></tr></table>`);
    }
    items = [];
  };
  for (const l of lines) {
    if (isItem(l)) {
      flushPara();
      if (!items.length) ordered = /^\d/.test(l);
      items.push(l.replace(/^(-|\*|•|\d{1,2}[.)])\s+/, ""));
    }
    else {
      flushItems();
      para.push(l);
    }
  }
  flushPara();
  flushItems();
  return out.join("\n");
}

/** Plain-text version: [Label](url) becomes "Label: url". */
function plainText(body: string) {
  return body.replace(LINK_MD, (_m, label: string, url: string) => `${label}: ${url}`);
}

export interface Quoted { name: string | null; address: string; at: string; body: string }

/** Branded HTML + plain text for one email. Every support@ email goes through this. */
export function brandedEmail(opts: { subject: string; body: string; preheader?: string; quoted?: Quoted | null }) {
  const body = opts.body.trim();
  const site = `${SITE}/?${UTM}`;
  const q = opts.quoted ?? null;
  const when = q ? new Date(q.at).toUTCString().replace(/:\d\d GMT$/, " GMT") : "";
  const who = q ? (q.name ? `${q.name} <${q.address}>` : q.address) : "";

  const text = [
    plainText(body), "",
    "Team MemberBook",
    `${SITE} · WhatsApp +91 91378 49812`,
    ...(q ? ["", `On ${when}, ${who} wrote:`, q.body.slice(0, 3000).split("\n").map(l => `> ${l}`).join("\n")] : []),
  ].join("\n");

  const preheader = (opts.preheader || plainText(body).replace(/^(hi|hello|dear)\b[^,\n]*,?\s*/i, "").replace(/\s+/g, " ")).slice(0, 140);
  const blocks = body.split(/\n\s*\n/).map(blockHtml).join("\n");
  const quotedHtml = q
    ? `<tr><td style="padding:0 28px 24px"><div style="border-top:1px solid #E7E4DC;padding-top:16px;${FONT};font-size:13px;color:#475569">On ${esc(when)}, ${esc(who)} wrote:</div>`
      + `<blockquote style="margin:6px 0 0;padding:0 0 0 12px;border-left:3px solid #CBD5E1;${FONT};font-size:13px;line-height:1.5;color:#475569">${esc(q.body.slice(0, 3000)).replace(/\n/g, "<br>")}</blockquote></td></tr>`
    : "";

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(opts.subject)}</title></head>
<body style="margin:0;padding:0;background:#F4F2EC">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F2EC"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:16px;border:1px solid #E7E4DC">
<tr><td style="padding:24px 28px 8px"><a href="${site}"><img src="${SITE}/logo.png" width="150" height="36" alt="MemberBook" style="display:block;border:0;width:150px;height:auto"></a></td></tr>
<tr><td style="padding:16px 28px 4px">
${blocks}
<p style="margin:8px 0 4px;${FONT};font-size:16px;line-height:1.6;color:${INK}">Team MemberBook</p>
<p style="margin:0 0 24px;${FONT};font-size:14px;line-height:1.6"><a href="${site}" style="color:${TEAL};text-decoration:none">memberbook.in</a> &middot; <a href="https://wa.me/919137849812" style="color:#475569;text-decoration:none">WhatsApp +91 91378 49812</a></p>
</td></tr>
${quotedHtml}
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px"><tr><td style="padding:16px 28px;${FONT};font-size:12px;line-height:1.6;color:#475569;text-align:center">
MemberBook &middot; fee tracking and WhatsApp reminders for gyms, libraries and coaching centres<br>Panvel, Maharashtra, India
</td></tr></table>
</td></tr></table></body></html>`;
  return { text, html };
}
