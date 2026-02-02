import { describe, it, expect, beforeAll } from "vitest";
import { setup } from "@nuxt/test-utils/e2e";
import {
  registerUser,
  createOrgAndGetSession,
  authFetch,
  type Session,
} from "../helpers/auth";
import { makeUser, makeOrg, makeMember, makePlan, makePayment } from "../helpers/data";

describe("Dashboard API", async () => {
  await setup({});

  let session: Session;
  let orgId: number;

  beforeAll(async () => {
    const reg = await registerUser(makeUser());
    session = await createOrgAndGetSession(reg, makeOrg());
    orgId = session.orgId!;

    // Seed data: member, plan, subscription, payment
    const memberData = await authFetch(session)<{ member: any }>(
      `/api/orgs/${orgId}/members`,
      { method: "POST", body: makeMember() },
    );
    const memberId = memberData.member.id;

    const planData = await authFetch(session)<{ plan: any }>(
      `/api/orgs/${orgId}/plans`,
      { method: "POST", body: makePlan({ durationDays: 5 }) },
    );

    // Create subscription starting today (ends in 5 days, within the 7-day window)
    await authFetch(session)(
      `/api/orgs/${orgId}/members/${memberId}/subscriptions`,
      {
        method: "POST",
        body: { planId: planData.plan.id, startDate: new Date().toISOString().split("T")[0] },
      },
    );

    // Create a payment for this month
    await authFetch(session)(
      `/api/orgs/${orgId}/payments`,
      {
        method: "POST",
        body: makePayment(memberId, { amount: 50000 }),
      },
    );
  });

  describe("GET /api/orgs/[orgId]/dashboard", () => {
    it("returns dashboard stats", async () => {
      const data = await authFetch(session)<{
        stats: {
          activeMembers: number;
          expiringSoon: number;
          monthRevenue: number;
          pendingPayments: number;
        };
        recentPayments: any[];
      }>(`/api/orgs/${orgId}/dashboard`);

      expect(data.stats).toHaveProperty("activeMembers");
      expect(data.stats).toHaveProperty("expiringSoon");
      expect(data.stats).toHaveProperty("monthRevenue");
      expect(data.stats).toHaveProperty("pendingPayments");
      expect(Array.isArray(data.recentPayments)).toBe(true);
    });

    it("has correct activeMembers count", async () => {
      const data = await authFetch(session)<{ stats: { activeMembers: number } }>(
        `/api/orgs/${orgId}/dashboard`,
      );
      expect(data.stats.activeMembers).toBeGreaterThanOrEqual(1);
    });

    it("has correct monthRevenue", async () => {
      const data = await authFetch(session)<{ stats: { monthRevenue: number } }>(
        `/api/orgs/${orgId}/dashboard`,
      );
      expect(data.stats.monthRevenue).toBeGreaterThanOrEqual(50000);
    });
  });
});
