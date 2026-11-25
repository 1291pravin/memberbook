import { describe, expect, it } from "vitest";
import { brandedEmail } from "../../server/utils/email-layout";
import { addUpiEmailText, AUTO_TRIAL_EXCLUDED_ORGS, trialStartedEmailText } from "../../server/utils/reminder-trials";

const c = { orgId: 60, businessName: "Iron Den Gym", type: "gym", upiId: "irond@ybl", members: 42, ownerEmail: "o@x.in", ownerName: "rahul verma" };

describe("reminder trial emails", () => {
  it("trial started email says what happens and how to switch off", () => {
    const t = trialStartedEmailText(c, "2026-12-08");
    expect(t.startsWith("Hi Rahul,")).toBe(true);
    expect(t).toContain("42 members");
    expect(t).toContain("until 8 December");
    expect(t).toContain("irond@ybl");
    expect(t).toContain("Nothing is charged automatically");
    const html = brandedEmail({ subject: "x", body: t }).html;
    expect(html).toContain(">Open Payment settings</a>");
    expect(html).toContain("dashboard/collections?settings=1");
  });

  it("no-UPI email asks for the UPI ID and uses student wording for libraries", () => {
    const t = addUpiEmailText({ ...c, type: "library", upiId: null, ownerName: "" });
    expect(t.startsWith("Hello,")).toBe(true);
    expect(t).toContain("42 students");
    expect(t).toContain("[Add your UPI ID]");
  });

  it("never auto-starts for Absolute Fit until the owner says yes", () => {
    expect(AUTO_TRIAL_EXCLUDED_ORGS).toContain(17);
  });
});
