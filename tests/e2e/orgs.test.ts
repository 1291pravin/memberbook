import { describe, it, expect, beforeAll } from "vitest";
import { setup, fetch } from "@nuxt/test-utils/e2e";
import {
  registerUser,
  loginUser,
  createOrgAndGetSession,
  authFetch,
  authFetchRaw,
  rawFetch,
  type Session,
} from "../helpers/auth";
import { makeUser, makeOrg } from "../helpers/data";

describe("Orgs API", async () => {
  await setup({});

  let ownerSession: Session;
  let staffSession: Session;
  let orgId: number;

  beforeAll(async () => {
    const regSession = await registerUser(makeUser());
    ownerSession = await createOrgAndGetSession(regSession, makeOrg());
    orgId = ownerSession.orgId!;

    staffSession = await registerUser(makeUser());
  });

  describe("POST /api/orgs/", () => {
    it("creates an org and sets currentOrg in session", async () => {
      const newUser = await registerUser(makeUser());
      const session = await createOrgAndGetSession(newUser, makeOrg({ name: "Fresh Org" }));
      expect(session.orgId).toBeGreaterThan(0);
    });

    it("returns 400 when missing name or type", async () => {
      const res = await authFetchRaw(ownerSession)("/api/orgs/", {
        method: "POST",
        body: { name: "No Type" },
      });
      expect(res.status).toBe(400);
    });

    it("returns 400 for invalid type", async () => {
      const res = await authFetchRaw(ownerSession)("/api/orgs/", {
        method: "POST",
        body: { name: "Bad Type", type: "restaurant" },
      });
      expect(res.status).toBe(400);
    });

    it("returns 401 when unauthenticated", async () => {
      const res = await rawFetch("/api/orgs/", {
        method: "POST",
        body: makeOrg(),
      });
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/orgs/", () => {
    it("returns the user's org list", async () => {
      const data = await authFetch(ownerSession)<{ orgs: any[] }>("/api/orgs/");
      expect(data.orgs.length).toBeGreaterThanOrEqual(1);
      expect(data.orgs.some((o: any) => o.orgId === orgId)).toBe(true);
    });

    it("returns 401 when unauthenticated", async () => {
      const res = await fetch("/api/orgs/");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/orgs/[orgId]", () => {
    it("returns org details and role", async () => {
      const data = await authFetch(ownerSession)<{ org: any; role: string }>(
        `/api/orgs/${orgId}`,
      );
      expect(data.org.id).toBe(orgId);
      expect(data.role).toBe("owner");
    });

    it("returns 403 for user without access", async () => {
      const res = await authFetchRaw(staffSession)(`/api/orgs/${orgId}`);
      expect(res.status).toBe(403);
    });
  });

  describe("PUT /api/orgs/[orgId]", () => {
    it("owner can update org", async () => {
      const data = await authFetch(ownerSession)<{ org: any }>(`/api/orgs/${orgId}`, {
        method: "PUT",
        body: { name: "Updated Org Name" },
      });
      expect(data.org.name).toBe("Updated Org Name");
    });

    it("staff gets 403 on org update", async () => {
      // Add staff to the org first
      await authFetch(ownerSession)(`/api/orgs/${orgId}/staff`, {
        method: "POST",
        body: { email: staffSession.user!.email },
      });

      // Staff logs in again to pick up currentOrg
      const loggedIn = await loginUser({
        email: staffSession.user!.email,
        password: "password123",
      });
      staffSession = { ...staffSession, cookies: loggedIn.cookies };

      const res = await authFetchRaw(staffSession)(`/api/orgs/${orgId}`, {
        method: "PUT",
        body: { name: "Staff Attempt" },
      });
      expect(res.status).toBe(403);
    });
  });
});
