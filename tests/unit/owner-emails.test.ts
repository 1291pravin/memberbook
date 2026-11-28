import { describe, expect, it } from "vitest";
import { brandedEmail } from "../../server/utils/email-layout";
import { dueDatesMissingEmailText, needsDueDateNudge, uploadFailedEmailText, welcomeEmailText } from "../../server/utils/owner-emails";

describe("owner emails", () => {
  it("welcome email offers free setup with a WhatsApp button", () => {
    const t = welcomeEmailText({ ownerName: "pradip kumar das", businessName: "SIKSHANI COACHING CENTRE", type: "tuition" });
    expect(t.startsWith("Hi Pradip,")).toBe(true);
    expect(t).toContain("Your student list");
    const html = brandedEmail({ subject: "Welcome", body: t }).html;
    expect(html).toContain(">Send it on WhatsApp</a>");
    expect(html).toContain("dashboard/upload?utm_source=email");
  });

  it("upload failed email passes on what to send instead", () => {
    const t = uploadFailedEmailText({ ownerName: "", businessName: "X Gym", message: "Both pictures are logos." });
    expect(t.startsWith("Hello,")).toBe(true);
    expect(t).toContain("Both pictures are logos.");
  });

  it("due dates email asks for plans, due dates and phones", () => {
    const t = dueDatesMissingEmailText({ ownerName: "clutch", businessName: "playcio", type: "other", loaded: 14, withoutDueDate: 14 });
    expect(t.startsWith("Hi Clutch,")).toBe(true);
    expect(t).toContain("We've loaded 14 members into playcio. None of them have a fee due date yet");
    expect(t).toContain("the date their next fee is due, and their phone number");
    const html = brandedEmail({ subject: "Due dates", body: t }).html;
    expect(html).toContain(">Send it on WhatsApp</a>");
    const some = dueDatesMissingEmailText({ ownerName: "", businessName: "X", type: "tuition", loaded: 10, withoutDueDate: 6 });
    expect(some).toContain("10 students into X. 6 of them don't have");
  });

  it("only nudges when at least half have no due date", () => {
    expect(needsDueDateNudge({ membersLoaded: 14, membersWithoutDueDate: 14 })).toBe(true);
    expect(needsDueDateNudge({ membersLoaded: 10, membersWithoutDueDate: 5 })).toBe(true);
    expect(needsDueDateNudge({ membersLoaded: 10, membersWithoutDueDate: 4 })).toBe(false);
    expect(needsDueDateNudge({ membersLoaded: 0, membersWithoutDueDate: 0 })).toBe(false);
  });
});
