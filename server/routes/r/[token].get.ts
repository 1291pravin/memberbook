/**
 * Public short link on the Google review poster (and in the WhatsApp ask
 * message): counts the scan, then sends the member to the business's Google
 * "write a review" page.
 */
export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Cache-Control", "no-store");
  setResponseHeader(event, "X-Robots-Tag", "noindex");
  const org = await getOrgByReviewToken(String(getRouterParam(event, "token") || ""));
  if (!org?.googleReviewUrl) {
    setResponseStatus(event, 404);
    setResponseHeader(event, "Content-Type", "text/html; charset=utf-8");
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Link not found</title><style>body{font-family:system-ui,Arial,sans-serif;background:#f8fafc;color:#1e293b;margin:0;padding:48px 16px}main{max-width:420px;margin:auto;background:#fff;border-radius:12px;padding:28px;box-shadow:0 1px 3px #0001}p{color:#475569;line-height:1.5}</style></head><body><main><h1 style="font-size:20px">This review link doesn't work any more</h1><p>Please ask at the front desk for the new one. Thank you!</p></main></body></html>`;
  }
  // Skip link previews (WhatsApp fetches the link to draw a card) so they don't count as scans.
  const ua = String(getRequestHeader(event, "user-agent") || "");
  const isBot = /bot|crawler|spider|preview|facebookexternalhit|WhatsApp|TelegramBot|Slackbot|curl|python|Go-http/i.test(ua);
  if (event.method === "GET" && !isBot) {
    const source = getQuery(event).s === "wa" ? "wa" : "qr";
    try {
      await logReviewScan(org.id, source);
    }
    catch (e) {
      console.error("review scan log failed", e);
    }
  }
  return sendRedirect(event, org.googleReviewUrl, 302);
});
