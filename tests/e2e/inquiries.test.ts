import { describe, it, expect, beforeAll } from "vitest";
import { setup } from "@nuxt/test-utils/e2e";
import {
  registerUser,
  createOrgAndGetSession,
  authFetch,
  authFetchRaw,
  type Session,
} from "../helpers/auth";
import { makeUser, makeOrg, makeInquiry } from "../helpers/data";

describe("Inquiries API", async () => {
  await setup({});

  let session: Session;
  let orgId: number;
  let inquiryId: number;

  beforeAll(async () => {
    const reg = await registerUser(makeUser());
    session = await createOrgAndGetSession(reg, makeOrg());
    orgId = session.orgId!;
  });

  describe("POST /api/orgs/[orgId]/inquiries", () => {
    it("creates an inquiry", async () => {
      const inquiry = makeInquiry();
      const data = await authFetch(session)<{ inquiry: any }>(
        `/api/orgs/${orgId}/inquiries`,
        { method: "POST", body: inquiry },
      );
      expect(data.inquiry.name).toBe(inquiry.name);
      expect(data.inquiry.status).toBe("new");
      inquiryId = data.inquiry.id;
    });

    it("returns 400 when name is missing", async () => {
      const res = await authFetchRaw(session)(`/api/orgs/${orgId}/inquiries`, {
        method: "POST",
        body: { phone: "1234567890" },
      });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/orgs/[orgId]/inquiries", () => {
    it("returns inquiries list", async () => {
      const data = await authFetch(session)<{ inquiries: any[] }>(
        `/api/orgs/${orgId}/inquiries`,
      );
      expect(data.inquiries.length).toBeGreaterThanOrEqual(1);
    });

    it("filters by status", async () => {
      const data = await authFetch(session)<{ inquiries: any[] }>(
        `/api/orgs/${orgId}/inquiries?status=new`,
      );
      expect(data.inquiries.every((i: any) => i.status === "new")).toBe(true);
    });
  });

  describe("PUT /api/orgs/[orgId]/inquiries/[inquiryId]", () => {
    it("updates inquiry status", async () => {
      const data = await authFetch(session)<{ inquiry: any }>(
        `/api/orgs/${orgId}/inquiries/${inquiryId}`,
        { method: "PUT", body: { status: "contacted" } },
      );
      expect(data.inquiry.status).toBe("contacted");
    });

    it("updates inquiry fields", async () => {
      const data = await authFetch(session)<{ inquiry: any }>(
        `/api/orgs/${orgId}/inquiries/${inquiryId}`,
        { method: "PUT", body: { notes: "Follow up next week", interest: "Yoga classes" } },
      );
      expect(data.inquiry.notes).toBe("Follow up next week");
      expect(data.inquiry.interest).toBe("Yoga classes");
    });

    it("returns 400 for empty body", async () => {
      const res = await authFetchRaw(session)(
        `/api/orgs/${orgId}/inquiries/${inquiryId}`,
        { method: "PUT", body: {} },
      );
      expect(res.status).toBe(400);
    });
  });
});
