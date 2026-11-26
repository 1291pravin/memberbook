import { describe, expect, it } from "vitest";
import { brandedEmail } from "../../server/utils/email-layout";
import { paymentNotFoundEmailText, planPaidEmailText } from "../../server/utils/plan-emails";

const c = { businessName: "Iron Den Gym", ownerName: "rahul verma", planName: "Autopilot", amount: 19900, upiRef: "123456789012", paidUntil: "2026-12-25" };

describe("plan payment emails", () => {
  it("payment received says the plan is on and until when", () => {
    const t = planPaidEmailText(c);
    expect(t.startsWith("Hi Rahul,")).toBe(true);
    expect(t).toContain("₹199");
    expect(t).toContain("123456789012");
    expect(t).toContain("Autopilot plan is now on for Iron Den Gym until 25 December 2026");
    const html = brandedEmail({ subject: "x", body: t }).html;
    expect(html).toContain(">See your plan</a>");
    expect(html).toContain("dashboard/billing");
  });

  it("payment not found asks to re-check the reference", () => {
    const t = paymentNotFoundEmailText({ ...c, ownerName: null });
    expect(t.startsWith("Hello,")).toBe(true);
    expect(t).toContain("couldn't find your payment of ₹199");
    expect(t).toContain("UPI reference (UTR)");
    expect(brandedEmail({ subject: "x", body: t }).html).toContain(">Open your plan</a>");
  });
});
