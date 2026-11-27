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

describe("cold email window", async () => {
  const { inOutreachWindow, OUTREACH_PER_RUN } = await import("../../server/utils/outreach");
  it("sends only 09:00-12:00 IST, in runs that fit 50 subrequests", () => {
    expect(inOutreachWindow(new Date("2026-11-27T03:30:00Z"))).toBe(true); // 09:00 IST
    expect(inOutreachWindow(new Date("2026-11-27T06:20:00Z"))).toBe(true); // 11:50 IST
    expect(inOutreachWindow(new Date("2026-11-27T06:30:00Z"))).toBe(false); // 12:00 IST
    expect(inOutreachWindow(new Date("2026-11-27T03:20:00Z"))).toBe(false); // 08:50 IST
    expect(OUTREACH_PER_RUN).toBeLessThanOrEqual(20);
  });
});
