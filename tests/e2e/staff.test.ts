import { describe, it, expect, beforeAll } from "vitest";
import { setup } from "@nuxt/test-utils/e2e";
import {
  registerUser,
  loginUser,
  createOrgAndGetSession,
  authFetch,
  authFetchRaw,
  type Session,
} from "../helpers/auth";
import { makeUser, makeOrg } from "../helpers/data";

describe("Staff API", async () => {
  await setup({});

  let ownerSession: Session;
  let staffSession: Session;
  let orgId: number;
  let staffMembershipId: number;
  const staffUser = makeUser();

  beforeAll(async () => {
    // Register owner and create org
    const reg = await registerUser(makeUser());
    ownerSession = await createOrgAndGetSession(reg, makeOrg());
    orgId = ownerSession.orgId!;

    // Register a user to be added as staff
    staffSession = await registerUser(staffUser);
  });

  describe("GET /api/orgs/[orgId]/staff", () => {
    it("returns staff list including owner", async () => {
      const data = await authFetch(ownerSession)<{ staff: any[] }>(
        `/api/orgs/${orgId}/staff`,
      );
      expect(data.staff.length).toBeGreaterThanOrEqual(1);
      expect(data.staff.some((s: any) => s.role === "owner")).toBe(true);
    });
  });

  describe("POST /api/orgs/[orgId]/staff", () => {
    it("adds staff by email", async () => {
      const data = await authFetch(ownerSession)<{ success: boolean }>(
        `/api/orgs/${orgId}/staff`,
        { method: "POST", body: { email: staffUser.email } },
      );
      expect(data.success).toBe(true);

      // Verify staff appears in list
      const listData = await authFetch(ownerSession)<{ staff: any[] }>(
        `/api/orgs/${orgId}/staff`,
      );
      const staffEntry = listData.staff.find(
        (s: any) => s.email === staffUser.email,
      );
      expect(staffEntry).toBeTruthy();
      expect(staffEntry.role).toBe("staff");
      staffMembershipId = staffEntry.id;
    });

    it("returns 404 when user not found", async () => {
      const res = await authFetchRaw(ownerSession)(`/api/orgs/${orgId}/staff`, {
        method: "POST",
        body: { email: "nonexistent@test.com" },
      });
      expect(res.status).toBe(404);
    });

    it("returns 409 when user is already a member", async () => {
      const res = await authFetchRaw(ownerSession)(`/api/orgs/${orgId}/staff`, {
        method: "POST",
        body: { email: staffUser.email },
      });
      expect(res.status).toBe(409);
    });

    it("staff cannot add other staff (403)", async () => {
      // Login as staff to get session with currentOrg
      const loggedIn = await loginUser({
        email: staffUser.email,
        password: staffUser.password,
      });
      staffSession = { ...staffSession, cookies: loggedIn.cookies, orgId };

      const anotherUser = await registerUser(makeUser());
      const res = await authFetchRaw(staffSession)(`/api/orgs/${orgId}/staff`, {
        method: "POST",
        body: { email: anotherUser.user!.email },
      });
      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /api/orgs/[orgId]/staff/[membershipId]", () => {
    it("cannot remove the owner", async () => {
      // Find owner membership ID
      const listData = await authFetch(ownerSession)<{ staff: any[] }>(
        `/api/orgs/${orgId}/staff`,
      );
      const ownerEntry = listData.staff.find((s: any) => s.role === "owner");
      const res = await authFetchRaw(ownerSession)(
        `/api/orgs/${orgId}/staff/${ownerEntry.id}`,
        { method: "DELETE" },
      );
      expect(res.status).toBe(400);
    });

    it("returns 404 for non-existent membership", async () => {
      const res = await authFetchRaw(ownerSession)(
        `/api/orgs/${orgId}/staff/99999`,
        { method: "DELETE" },
      );
      expect(res.status).toBe(404);
    });

    it("staff cannot delete staff (403)", async () => {
      const res = await authFetchRaw(staffSession)(
        `/api/orgs/${orgId}/staff/${staffMembershipId}`,
        { method: "DELETE" },
      );
      expect(res.status).toBe(403);
    });

    it("owner removes staff member", async () => {
      const data = await authFetch(ownerSession)<{ success: boolean }>(
        `/api/orgs/${orgId}/staff/${staffMembershipId}`,
        { method: "DELETE" },
      );
      expect(data.success).toBe(true);
    });
  });
});
