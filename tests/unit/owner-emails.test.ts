import { describe, expect, it } from "vitest";
import { brandedEmail } from "../../server/utils/email-layout";
import { uploadFailedEmailText, welcomeEmailText } from "../../server/utils/owner-emails";

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
});
