// Set MemberBook's WhatsApp Business profile: photo, about, description, email and website.
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const pub = useRuntimeConfig().public as { appUrl?: string; supportEmail?: string; supportHours?: string };
  const site = (pub.appUrl || "https://memberbook.in").replace(/\/$/, "");
  // Bundled server asset: a Worker can't fetch its own public URL (Cloudflare returns 522).
  const photo = await useStorage("assets:server").getItemRaw<ArrayBuffer | Uint8Array>("whatsapp-profile.png");
  const hours = pub.supportHours || "Mon to Sat, 10 AM to 7 PM IST";

  const result = await updateBusinessProfile({
    about: "Fee reminders and member records for gyms, libraries and coaching centres. Set up for you, free.",
    description: `MemberBook keeps your members, plans and due dates in one place, and reminds members on WhatsApp when fees are due, with a UPI pay link. Send us your member register and we set everything up for free. Support hours: ${hours}.`,
    email: pub.supportEmail || "support@memberbook.in",
    websites: [site],
    vertical: "PROF_SERVICES",
    photo: photo ? { bytes: photo, type: "image/png" } : undefined,
  });
  await recordAdminAuditLog(event, "whatsapp_update_profile", { metadata: { ok: result.ok, photo: result.photo ?? false, error: result.error?.slice(0, 300) } });
  if (!result.ok) throw createError({ statusCode: 502, statusMessage: `Meta did not update the profile: ${result.error}` });
  return result;
});
