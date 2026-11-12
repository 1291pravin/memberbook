import { sql } from "drizzle-orm";
import { getSetupUser } from "../../../utils/org-setup";

/** Businesses we set up for their owners, newest first, with handover status. */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const setupUser = await getSetupUser();
  const base = appBaseUrl(event);

  type Row = {
    id: number;
    name: string;
    type: string;
    owner_whatsapp: string | null;
    upi_id: string | null;
    created_at: string;
    members: number;
    plans: number;
    held_by_setup: number;
    owner_email: string | null;
    owner_name: string | null;
    invite_token: string | null;
    invite_status: string | null;
    invite_expires_at: string | null;
    accepted_at: string | null;
  };
  const rows = await db.all<Row>(sql`
    SELECT o.id, o.name, o.type, o.owner_whatsapp, o.upi_id, o.created_at,
      (SELECT count(*) FROM members m WHERE m.org_id = o.id) AS members,
      (SELECT count(*) FROM subscription_plans p WHERE p.org_id = o.id AND p.active = 1) AS plans,
      EXISTS (SELECT 1 FROM org_memberships om WHERE om.org_id = o.id AND om.user_id = ${setupUser.id}) AS held_by_setup,
      (SELECT u.email FROM org_memberships om JOIN users u ON u.id = om.user_id
        WHERE om.org_id = o.id AND om.role = 'owner' AND om.user_id != ${setupUser.id} ORDER BY om.id LIMIT 1) AS owner_email,
      (SELECT u.name FROM org_memberships om JOIN users u ON u.id = om.user_id
        WHERE om.org_id = o.id AND om.role = 'owner' AND om.user_id != ${setupUser.id} ORDER BY om.id LIMIT 1) AS owner_name,
      i.token AS invite_token, i.status AS invite_status, i.expires_at AS invite_expires_at, i.accepted_at
    FROM organizations o
    JOIN org_invites i ON i.id = (
      SELECT id FROM org_invites WHERE org_id = o.id AND role = 'owner' ORDER BY id DESC LIMIT 1
    )
    ORDER BY o.created_at DESC
    LIMIT 200
  `);

  const now = Date.now();
  return {
    setupEmail: setupUser.email,
    businesses: rows.map((r: Row) => {
      const pending = r.invite_status === "pending" && new Date(r.invite_expires_at || 0).getTime() > now;
      return {
        id: r.id,
        name: r.name,
        type: r.type,
        ownerWhatsapp: r.owner_whatsapp,
        upiSet: Boolean(r.upi_id),
        createdAt: r.created_at,
        members: Number(r.members),
        plans: Number(r.plans),
        heldBySetup: Boolean(r.held_by_setup),
        ownerEmail: r.owner_email,
        ownerName: r.owner_name,
        claimedAt: r.accepted_at,
        inviteStatus: pending ? "pending" : r.invite_status === "pending" ? "expired" : r.invite_status,
        inviteUrl: pending && r.invite_token ? `${base}/invite/${r.invite_token}` : null,
        inviteExpiresAt: pending ? r.invite_expires_at : null,
      };
    }),
  };
});
