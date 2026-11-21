/**
 * End-to-end test of the email auto-reply: sends an email through Resend from
 * e2e-test@memberbook.in to support@memberbook.in, so it travels the real path
 * (MX, Email Routing, the Worker, the AI task, the reply via Resend).
 */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const body = await readBody<{ subject?: unknown; text?: unknown; name?: unknown }>(event).catch(() => ({} as Record<string, unknown>));
  const apiKey = String(useRuntimeConfig(event).resendApiKey || "");
  if (!apiKey) throw createError({ statusCode: 503, statusMessage: "NUXT_RESEND_API_KEY is not set" });
  const name = typeof body?.name === "string" && body.name.trim() ? body.name.trim().slice(0, 60) : "Test Gym Owner";
  const subject = typeof body?.subject === "string" && body.subject.trim() ? body.subject.trim().slice(0, 200) : "Question about MemberBook";
  const text = typeof body?.text === "string" && body.text.trim() ? body.text.trim().slice(0, 3000) : "Hi, I run a small gym with about 120 members. Is MemberBook really free, and how do I get my members in?";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: `${name} <${E2E_TEST_ADDRESS}>`, to: [SUPPORT_ADDRESS], subject, text }),
  });
  const out = await res.json().catch(() => ({})) as { id?: string; message?: string };
  if (!res.ok) throw createError({ statusCode: 502, statusMessage: `Resend ${res.status}: ${out.message || "send failed"}` });
  return { ok: true, id: out.id, from: E2E_TEST_ADDRESS, to: SUPPORT_ADDRESS };
});
