import { parseOrgContact } from "../../utils/org-contact";
import { ORG_TYPES, createOrganization } from "../../utils/org-setup";

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readBody(event);
  const { name, type } = body;

  let contact;
  try {
    contact = parseOrgContact(body.ownerWhatsapp, body.setupHelpConsent);
  } catch (error) {
    throw createError({ statusCode: 400, statusMessage: (error as Error).message });
  }

  if (!name || !type) {
    throw createError({ statusCode: 400, statusMessage: "Name and type are required" });
  }

  if (!(ORG_TYPES as readonly string[]).includes(type)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid organization type" });
  }

  const org = await createOrganization({ name, type, ownerUserId: user.id, ...contact });

  await setUserSession(event, {
    user: { id: user.id, email: user.email, name: user.name },
    currentOrg: { orgId: org.id, name: org.name, slug: org.slug, type: org.type, role: "owner" },
  });

  return { org };
});
