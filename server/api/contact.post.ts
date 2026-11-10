export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const name = body?.name?.trim();
  const phone = body?.phone?.trim();
  const email = body?.email?.trim().toLowerCase();
  const business = body?.business?.trim();
  const message = body?.message?.trim();

  if (!name || !phone || !email || !business || !message) {
    throw createError({
      statusCode: 400,
      statusMessage: "Name, phone, email, business, and message are required",
    });
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Please provide a valid email address",
    });
  }

  if (message.length > 5000) {
    throw createError({
      statusCode: 400,
      statusMessage: "Message is too long",
    });
  }

  await enforceRateLimit(`contact:ip:${getClientIp(event)}`, { limit: 5, windowSeconds: 3600 });

  const inserted = await db.insert(schema.contactSubmissions).values({
    name,
    phone,
    email,
    businessName: business,
    message,
    sourcePage: "/contact",
  }).returning();

  return {
    ok: true,
    submission: { id: inserted[0]?.id },
  };
});
