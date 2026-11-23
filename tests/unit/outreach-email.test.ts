import { describe, expect, it } from "vitest";
import { outreachCityPage, outreachEmail } from "../../server/utils/outreach";

const lead = (over: Record<string, unknown> = {}) => ({
  id: 1, email: "a@b.in", businessName: "Gyan Library", contactName: null, businessType: "library", city: "Patna",
  sourceUrl: null, status: "new", token: "tok", sentAt: null, followedUpAt: null, lastError: null, notes: null,
  createdAt: "", updatedAt: "", ...over,
});

describe("cold email city pages", () => {
  it("matches city names loosely", () => {
    expect(outreachCityPage({ businessType: "gym", city: "New Delhi" })?.path).toBe("/gym-software/delhi");
    expect(outreachCityPage({ businessType: "coaching", city: "Talwandi, Kota" })?.path).toBe("/coaching-software/kota");
    expect(outreachCityPage({ businessType: "library", city: "Allahabad" })?.path).toBe("/library-software/prayagraj");
    expect(outreachCityPage({ businessType: "gym", city: "Patna" })).toBeNull();
    expect(outreachCityPage({ businessType: "other", city: "Delhi" })).toBeNull();
  });

  it("links a city lead to its city page with UTM tags", () => {
    const m = outreachEmail(lead(), "first", "https://memberbook.in");
    const url = "https://memberbook.in/library-software/patna?utm_source=email&utm_medium=cold-email&utm_campaign=city-library-patna&utm_content=first";
    expect(m.text).toContain(`See how it works for libraries in Patna: ${url}`);
    expect(m.text).toContain("while looking at libraries in Patna");
    expect(m.html).toContain(`href="${url}"`);
    expect(outreachEmail(lead(), "follow_up", "https://memberbook.in").html).toContain("utm_content=follow-up");
  });

  it("keeps the homepage link for other leads", () => {
    const m = outreachEmail(lead({ city: "Rohtak" }), "first", "https://memberbook.in");
    expect(m.text).toContain("See how MemberBook works: https://memberbook.in/?utm_source=email");
    expect(m.text).toContain("found Gyan Library online");
  });
});
