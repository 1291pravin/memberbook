// @vitest-environment node
import { describe, expect, it } from "vitest";
import { automatedReason, emailReplyBodies, isOptOut, parseEmail, stripQuoted } from "../../server/utils/email-inbox";

const raw = (headers: string, body = "Hi, how much does it cost for my gym?") => [
  "From: Ravi Kumar <ravi.gym@gmail.com>",
  "To: support@memberbook.in",
  "Subject: Re: Fee tracking for Iron Gym",
  "Message-ID: <abc123@mail.gmail.com>",
  "In-Reply-To: <first@memberbook.in>",
  "References: <first@memberbook.in>",
  ...(headers ? [headers] : []),
  "Content-Type: text/plain; charset=utf-8",
  "",
  body,
  "",
  "On Sat, 22 Nov 2026 at 09:00, MemberBook <support@memberbook.in> wrote:",
  "> Hi Ravi,",
  "> I found Iron Gym online",
].join("\r\n");

describe("email inbox", () => {
  it("parses a reply and drops the quoted email", async () => {
    const mail = await parseEmail(raw(""));
    expect(mail.from).toBe("ravi.gym@gmail.com");
    expect(mail.name).toBe("Ravi Kumar");
    expect(mail.messageId).toBe("<abc123@mail.gmail.com>");
    expect(mail.references).toContain("<first@memberbook.in>");
    expect(mail.text).toBe("Hi, how much does it cost for my gym?");
    expect(automatedReason(mail, "ravi.gym@gmail.com")).toBeNull();
  });

  it("skips bounces, auto-replies, lists, no-reply senders and our own mail", async () => {
    expect(automatedReason(await parseEmail(raw("")), "")).toBe("bounce");
    expect(automatedReason(await parseEmail(raw("Auto-Submitted: auto-replied")), "x@y.com")).toBe("auto-reply");
    expect(automatedReason(await parseEmail(raw("List-Unsubscribe: <https://x.com/u>")), "x@y.com")).toBe("mailing list");
    expect(automatedReason(await parseEmail(raw("Precedence: bulk")), "x@y.com")).toBe("bulk mail");
    const noreply = await parseEmail(raw("").replace("ravi.gym@gmail.com", "no-reply@shop.com"));
    expect(automatedReason(noreply, "x@y.com")).toBe("no-reply sender");
    const ours = await parseEmail(raw("").replace("ravi.gym@gmail.com", "support@memberbook.in"));
    expect(automatedReason(ours, "x@y.com")).toBe("our own address");
  });

  it("spots opt-outs but not normal questions", () => {
    expect(isOptOut("Re: Fee tracking", "Unsubscribe")).toBe(true);
    expect(isOptOut("Re: Fee tracking", "Please remove me from your list")).toBe(true);
    expect(isOptOut("Re: Fee tracking", "Not interested, thanks")).toBe(true);
    expect(isOptOut("Re: Fee tracking", "Yes please set it up. How do I stop paper registers?")).toBe(false);
  });

  it("strips Outlook-style quotes", () => {
    expect(stripQuoted("Sounds good\n\n-----Original Message-----\nFrom: x")).toBe("Sounds good");
  });

  it("builds a reply with signature and quote", () => {
    const b = emailReplyBodies("Hi Ravi,\n\nIt's free. Send your register on WhatsApp.", { name: "Ravi", address: "ravi@x.com", at: "2026-11-22T04:00:00Z", body: "How much?" });
    expect(b.text).toContain("Team MemberBook");
    expect(b.text).toContain("> How much?");
    expect(b.html).toContain("<blockquote");
    expect(b.html).toContain("/logo.png");
    expect(b.html).not.toContain("<script");
  });

  it("always renders the branded layout: buttons, lists, links, escaping", () => {
    const b = emailReplyBodies("Hi <b>Ravi</b>,\n\nAll we need:\n1. Your plans\n2. Your list\n\n[Send on WhatsApp](https://wa.me/919137849812)\n\nOr see [our guide](https://memberbook.in/guides).", null, "Setup");
    expect(b.html).toContain("<title>Setup</title>");
    expect(b.html).toContain("&lt;b&gt;Ravi&lt;/b&gt;");
    expect(b.html).toContain("background:#0F766E\"><a href=\"https://wa.me/919137849812\"");
    expect(b.html).toContain(">Send on WhatsApp</a>");
    expect(b.html).toContain(">our guide</a>");
    expect(b.html).toContain("2.</td>");
    expect(b.text).toContain("Send on WhatsApp: https://wa.me/919137849812");
    expect(b.text).not.toContain("<a ");
  });
});
