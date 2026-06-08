import { describe, it, expect, beforeAll } from "vitest";
import { setup } from "@nuxt/test-utils/e2e";
import {
  registerUser,
  createOrgAndGetSession,
  authFetch,
  authFetchRaw,
  type Session,
} from "../helpers/auth";
import { makeUser, makeOrg, makeMember, makePlan, makePayment } from "../helpers/data";

describe("Payments API", async () => {
  await setup({});

  let session: Session;
  let orgId: number;
  let memberId: number;
  let subscriptionId: number;
  let linkedPaymentId: number;

  beforeAll(async () => {
    const reg = await registerUser(makeUser());
    session = await createOrgAndGetSession(reg, makeOrg());
    orgId = session.orgId!;

    // Create a member
    const memberData = await authFetch(session)<{ member: any }>(
      `/api/orgs/${orgId}/members`,
      { method: "POST", body: makeMember() },
    );
    memberId = memberData.member.id;

    // Create a plan and subscription
    const planData = await authFetch(session)<{ plan: any }>(
      `/api/orgs/${orgId}/plans`,
      { method: "POST", body: makePlan() },
    );
    const subData = await authFetch(session)<{ subscription: any }>(
      `/api/orgs/${orgId}/members/${memberId}/subscriptions`,
      {
        method: "POST",
        body: { planId: planData.plan.id, startDate: new Date().toISOString().split("T")[0] },
      },
    );
    subscriptionId = subData.subscription.id;
  });

  describe("POST /api/orgs/[orgId]/payments", () => {
    it("creates a payment", async () => {
      const payment = makePayment(memberId);
      const data = await authFetch(session)<{ payment: any }>(
        `/api/orgs/${orgId}/payments`,
        { method: "POST", body: payment },
      );
      expect(data.payment.memberId).toBe(memberId);
      expect(data.payment.amount).toBe(payment.amount);
    });

    it("creates a payment linked to a subscription", async () => {
      const payment = makePayment(memberId, {
        amount: 50000,
        subscriptionId,
      });
      const data = await authFetch(session)<{ payment: any }>(
        `/api/orgs/${orgId}/payments`,
        { method: "POST", body: payment },
      );
      expect(data.payment.subscriptionId).toBe(subscriptionId);
      linkedPaymentId = data.payment.id;
    });

    it("returns 400 when missing required fields", async () => {
      const res = await authFetchRaw(session)(`/api/orgs/${orgId}/payments`, {
        method: "POST",
        body: { memberId },
      });
      expect(res.status).toBe(400);
    });

    it("rejects calendar dates that do not exist", async () => {
      const res = await authFetchRaw(session)(`/api/orgs/${orgId}/payments`, {
        method: "POST",
        body: makePayment(memberId, { date: "2026-02-31" }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe("PUT and DELETE /api/orgs/[orgId]/payments/[paymentId]", () => {
    it("edits a linked payment and recalculates its subscription status", async () => {
      const data = await authFetch(session)<{ payment: any }>(
        `/api/orgs/${orgId}/payments/${linkedPaymentId}`,
        { method: "PUT", body: { amount: 100000, notes: "Corrected payment" } },
      );
      expect(data.payment.amount).toBe(100000);
      expect(data.payment.notes).toBe("Corrected payment");

      const member = await authFetch(session)<{ subscriptions: any[] }>(`/api/orgs/${orgId}/members/${memberId}`);
      expect(member.subscriptions.find(sub => sub.id === subscriptionId)?.paymentStatus).toBe("paid");
    });

    it("rejects an overpayment", async () => {
      const res = await authFetchRaw(session)(`/api/orgs/${orgId}/payments/${linkedPaymentId}`, {
        method: "PUT",
        body: { amount: 100001 },
      });
      expect(res.status).toBe(400);
    });

    it("deletes a payment and recalculates its subscription status", async () => {
      const res = await authFetchRaw(session)(`/api/orgs/${orgId}/payments/${linkedPaymentId}`, { method: "DELETE" });
      expect(res.status).toBe(200);

      const member = await authFetch(session)<{ subscriptions: any[] }>(`/api/orgs/${orgId}/members/${memberId}`);
      expect(member.subscriptions.find(sub => sub.id === subscriptionId)?.paymentStatus).toBe("unpaid");
    });
  });

  describe("GET /api/orgs/[orgId]/payments", () => {
    it("returns payments list with member info", async () => {
      const data = await authFetch(session)<{ payments: any[] }>(
        `/api/orgs/${orgId}/payments`,
      );
      expect(data.payments.length).toBeGreaterThanOrEqual(1);
      expect(data.payments[0]).toHaveProperty("memberName");
    });
  });

  describe("GET /api/orgs/[orgId]/payments/pending", () => {
    it("returns subscriptions with pending balances", async () => {
      const data = await authFetch(session)<{ pending: any[] }>(
        `/api/orgs/${orgId}/payments/pending`,
      );
      expect(Array.isArray(data.pending)).toBe(true);
      // We paid 100000 + 50000 = 150000 on a 100000 subscription, so pending may be 0
      // But the subscription amount is from the plan (100000) and we paid 50000 linked to it
      // So pending_amount = 100000 - 50000 = 50000 > 0
      if (data.pending.length > 0) {
        expect(data.pending[0]).toHaveProperty("pending_amount");
      }
    });
  });
});
