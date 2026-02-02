import { describe, it, expect, beforeAll } from "vitest";
import { setup } from "@nuxt/test-utils/e2e";
import {
  registerUser,
  createOrgAndGetSession,
  authFetch,
  authFetchRaw,
  type Session,
} from "../helpers/auth";
import { makeUser, makeOrg, makeMember, makePlan } from "../helpers/data";

describe("Members API", async () => {
  await setup({});

  let session: Session;
  let orgId: number;
  let memberId: number;
  let planId: number;

  beforeAll(async () => {
    const reg = await registerUser(makeUser());
    session = await createOrgAndGetSession(reg, makeOrg());
    orgId = session.orgId!;

    // Create a plan for subscription tests
    const plan = makePlan();
    const planData = await authFetch(session)<{ plan: any }>(
      `/api/orgs/${orgId}/plans`,
      { method: "POST", body: plan },
    );
    planId = planData.plan.id;
  });

  describe("POST /api/orgs/[orgId]/members", () => {
    it("creates a member", async () => {
      const member = makeMember();
      const data = await authFetch(session)<{ member: any }>(
        `/api/orgs/${orgId}/members`,
        { method: "POST", body: member },
      );
      expect(data.member.name).toBe(member.name);
      expect(data.member.id).toBeGreaterThan(0);
      memberId = data.member.id;
    });

    it("returns 400 when name is missing", async () => {
      const res = await authFetchRaw(session)(`/api/orgs/${orgId}/members`, {
        method: "POST",
        body: { phone: "1234567890" },
      });
      expect(res.status).toBe(400);
    });

    it("creates a member with minimal fields", async () => {
      const data = await authFetch(session)<{ member: any }>(
        `/api/orgs/${orgId}/members`,
        { method: "POST", body: { name: "Minimal Member" } },
      );
      expect(data.member.name).toBe("Minimal Member");
      expect(data.member.phone).toBeNull();
    });
  });

  describe("GET /api/orgs/[orgId]/members", () => {
    it("returns list of members", async () => {
      const data = await authFetch(session)<{ members: any[] }>(
        `/api/orgs/${orgId}/members`,
      );
      expect(data.members.length).toBeGreaterThanOrEqual(2);
    });

    it("filters by status", async () => {
      const data = await authFetch(session)<{ members: any[] }>(
        `/api/orgs/${orgId}/members?status=active`,
      );
      expect(data.members.every((m: any) => m.status === "active")).toBe(true);
    });

    it("searches by name", async () => {
      const data = await authFetch(session)<{ members: any[] }>(
        `/api/orgs/${orgId}/members?search=Minimal`,
      );
      expect(data.members.length).toBeGreaterThanOrEqual(1);
      expect(data.members[0].name).toContain("Minimal");
    });

    it("searches by phone", async () => {
      // Use the phone from the first created member
      const allData = await authFetch(session)<{ members: any[] }>(
        `/api/orgs/${orgId}/members`,
      );
      const firstWithPhone = allData.members.find((m: any) => m.phone);
      if (firstWithPhone) {
        const phonePart = firstWithPhone.phone.slice(0, 5);
        const data = await authFetch(session)<{ members: any[] }>(
          `/api/orgs/${orgId}/members?search=${phonePart}`,
        );
        expect(data.members.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe("GET /api/orgs/[orgId]/members/[memberId]", () => {
    it("returns member with subscriptions and payments", async () => {
      const data = await authFetch(session)<{
        member: any;
        subscriptions: any[];
        payments: any[];
      }>(`/api/orgs/${orgId}/members/${memberId}`);
      expect(data.member.id).toBe(memberId);
      expect(Array.isArray(data.subscriptions)).toBe(true);
      expect(Array.isArray(data.payments)).toBe(true);
    });

    it("returns 404 for non-existent member", async () => {
      const res = await authFetchRaw(session)(`/api/orgs/${orgId}/members/99999`);
      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/orgs/[orgId]/members/[memberId]", () => {
    it("updates member fields", async () => {
      const data = await authFetch(session)<{ member: any }>(
        `/api/orgs/${orgId}/members/${memberId}`,
        { method: "PUT", body: { name: "Updated Name", phone: "1111111111" } },
      );
      expect(data.member.name).toBe("Updated Name");
      expect(data.member.phone).toBe("1111111111");
    });

    it("sets member to inactive", async () => {
      const data = await authFetch(session)<{ member: any }>(
        `/api/orgs/${orgId}/members/${memberId}`,
        { method: "PUT", body: { status: "inactive" } },
      );
      expect(data.member.status).toBe("inactive");

      // Reset to active for further tests
      await authFetch(session)(`/api/orgs/${orgId}/members/${memberId}`, {
        method: "PUT",
        body: { status: "active" },
      });
    });

    it("returns 400 for empty body", async () => {
      const res = await authFetchRaw(session)(`/api/orgs/${orgId}/members/${memberId}`, {
        method: "PUT",
        body: {},
      });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/orgs/[orgId]/members/[memberId]/subscriptions", () => {
    it("adds a subscription to a member", async () => {
      const data = await authFetch(session)<{ subscription: any }>(
        `/api/orgs/${orgId}/members/${memberId}/subscriptions`,
        {
          method: "POST",
          body: { planId, startDate: new Date().toISOString().split("T")[0] },
        },
      );
      expect(data.subscription.memberId).toBe(memberId);
      expect(data.subscription.planId).toBe(planId);
      expect(data.subscription.endDate).toBeTruthy();
    });

    it("returns 400 when missing fields", async () => {
      const res = await authFetchRaw(session)(
        `/api/orgs/${orgId}/members/${memberId}/subscriptions`,
        { method: "POST", body: { planId } },
      );
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/orgs/[orgId]/members/expiring", () => {
    it("returns expiring subscriptions list", async () => {
      const data = await authFetch(session)<{ expiring: any[] }>(
        `/api/orgs/${orgId}/members/expiring`,
      );
      expect(Array.isArray(data.expiring)).toBe(true);
    });
  });
});
