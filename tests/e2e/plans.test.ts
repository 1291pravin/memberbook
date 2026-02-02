import { describe, it, expect, beforeAll } from "vitest";
import { setup } from "@nuxt/test-utils/e2e";
import {
  registerUser,
  createOrgAndGetSession,
  authFetch,
  authFetchRaw,
  type Session,
} from "../helpers/auth";
import { makeUser, makeOrg, makePlan } from "../helpers/data";

describe("Plans API", async () => {
  await setup({});

  let session: Session;
  let orgId: number;
  let planId: number;

  beforeAll(async () => {
    const reg = await registerUser(makeUser());
    session = await createOrgAndGetSession(reg, makeOrg());
    orgId = session.orgId!;
  });

  describe("POST /api/orgs/[orgId]/plans", () => {
    it("creates a plan", async () => {
      const plan = makePlan();
      const data = await authFetch(session)<{ plan: any }>(
        `/api/orgs/${orgId}/plans`,
        { method: "POST", body: plan },
      );
      expect(data.plan.name).toBe(plan.name);
      expect(data.plan.price).toBe(plan.price);
      expect(data.plan.durationDays).toBe(plan.durationDays);
      planId = data.plan.id;
    });

    it("returns 400 when missing required fields", async () => {
      const res = await authFetchRaw(session)(`/api/orgs/${orgId}/plans`, {
        method: "POST",
        body: { name: "Incomplete" },
      });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/orgs/[orgId]/plans", () => {
    it("returns list of plans", async () => {
      const data = await authFetch(session)<{ plans: any[] }>(
        `/api/orgs/${orgId}/plans`,
      );
      expect(data.plans.length).toBeGreaterThanOrEqual(1);
      expect(data.plans.some((p: any) => p.id === planId)).toBe(true);
    });
  });

  describe("PUT /api/orgs/[orgId]/plans/[planId]", () => {
    it("updates a plan", async () => {
      const data = await authFetch(session)<{ plan: any }>(
        `/api/orgs/${orgId}/plans/${planId}`,
        { method: "PUT", body: { name: "Updated Plan", price: 200000 } },
      );
      expect(data.plan.name).toBe("Updated Plan");
      expect(data.plan.price).toBe(200000);
    });

    it("deactivates a plan", async () => {
      const data = await authFetch(session)<{ plan: any }>(
        `/api/orgs/${orgId}/plans/${planId}`,
        { method: "PUT", body: { active: false } },
      );
      expect(data.plan.active).toBe(false);
    });

    it("returns 400 for empty body", async () => {
      const res = await authFetchRaw(session)(`/api/orgs/${orgId}/plans/${planId}`, {
        method: "PUT",
        body: {},
      });
      expect(res.status).toBe(400);
    });
  });
});
