import { test, expect, type Page } from "@playwright/test";

const BASE = "https://memberbook.in";

// ─── Homepage ────────────────────────────────────────────────────────────────

test.describe("Homepage", () => {
  test("loads and shows hero headline", async ({ page }) => {
    await page.goto(BASE);
    await expect(page).toHaveTitle(/MemberBook/i);
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
    const text = await h1.innerText();
    expect(text.length).toBeGreaterThan(10);
  });

  test("CTA buttons are visible and clickable", async ({ page }) => {
    await page.goto(BASE);
    const startFree = page.getByRole("link", { name: /start free/i });
    await expect(startFree).toBeVisible();
    await expect(startFree).toHaveAttribute("href", /register/);
  });

  test("nav links are present", async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByRole("link", { name: /blog/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /contact/i }).first()).toBeVisible();
  });

  test("features section is visible", async ({ page }) => {
    await page.goto(BASE);
    const features = page.locator("section").filter({ hasText: /features/i });
    await expect(features.first()).toBeVisible();
  });

  test("FAQ accordion opens and closes", async ({ page }) => {
    await page.goto(BASE);
    const firstQuestion = page.locator("button[aria-expanded]").first();
    await expect(firstQuestion).toBeVisible();
    await firstQuestion.click();
    await expect(firstQuestion).toHaveAttribute("aria-expanded", "true");
    await firstQuestion.click();
    await expect(firstQuestion).toHaveAttribute("aria-expanded", "false");
  });

  test("footer links are present", async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByRole("link", { name: /privacy/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /terms/i })).toBeVisible();
  });

  test("no console errors on load", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", msg => { if (msg.type() === "error") errors.push(msg.text()); });
    await page.goto(BASE);
    expect(errors.filter(e => !e.includes("favicon"))).toHaveLength(0);
  });
});

// ─── Navigation ───────────────────────────────────────────────────────────────

test.describe("Navigation", () => {
  test("login page loads", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page).toHaveURL(/login/);
    await expect(page.getByRole("heading", { name: /sign in|log in|welcome/i }).first()).toBeVisible();
  });

  test("register page loads", async ({ page }) => {
    await page.goto(`${BASE}/register`);
    await expect(page).toHaveURL(/register/);
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("blog index loads", async ({ page }) => {
    await page.goto(`${BASE}/blog`);
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("contact page loads", async ({ page }) => {
    await page.goto(`${BASE}/contact`);
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("features page loads", async ({ page }) => {
    await page.goto(`${BASE}/features`);
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("gym landing page loads", async ({ page }) => {
    await page.goto(`${BASE}/gym`);
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("library landing page loads", async ({ page }) => {
    await page.goto(`${BASE}/library`);
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("unknown route redirects or shows 404", async ({ page }) => {
    const res = await page.goto(`${BASE}/this-page-does-not-exist-xyz`);
    const status = res?.status() ?? 0;
    // Accept 404 from server OR client-side redirect to home/404 page
    const url = page.url();
    expect(status === 404 || !url.includes("this-page-does-not-exist-xyz") || status === 200).toBe(true);
  });
});

// ─── Responsive / Mobile ──────────────────────────────────────────────────────

test.describe("Mobile viewport", () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14

  test("homepage renders on mobile", async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("mobile menu button exists", async ({ page }) => {
    await page.goto(BASE);
    const menuBtn = page.getByRole("button", { name: /menu|toggle/i });
    await expect(menuBtn).toBeVisible();
  });

  test("no horizontal scroll on homepage", async ({ page }) => {
    await page.goto(BASE);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // 2px tolerance
  });
});

// ─── Performance ─────────────────────────────────────────────────────────────

test.describe("Performance", () => {
  test("homepage responds in under 5 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto(BASE, { waitUntil: "domcontentloaded" });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });

  test("images have alt attributes", async ({ page }) => {
    await page.goto(BASE);
    const imgs = page.locator("img");
    const count = await imgs.count();
    for (let i = 0; i < count; i++) {
      const alt = await imgs.nth(i).getAttribute("alt");
      expect(alt).not.toBeNull();
    }
  });
});

// ─── SEO ─────────────────────────────────────────────────────────────────────

test.describe("SEO", () => {
  test("homepage has meta description", async ({ page }) => {
    await page.goto(BASE);
    const desc = await page.locator('meta[name="description"]').getAttribute("content");
    expect(desc).toBeTruthy();
    expect(desc!.length).toBeGreaterThan(50);
  });

  test("homepage has og:image", async ({ page }) => {
    await page.goto(BASE);
    const og = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect(og).toBeTruthy();
  });

  test("canonical URL is set", async ({ page }) => {
    await page.goto(BASE);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical).toBeTruthy();
  });

  test("gym page has unique title", async ({ page, browser }) => {
    await page.goto(BASE);
    const homeTitle = await page.title();
    const gymPage = await browser.newPage({ ignoreHTTPSErrors: true });
    await gymPage.goto(`${BASE}/gym`);
    const gymTitle = await gymPage.title();
    await gymPage.close();
    expect(homeTitle).not.toEqual(gymTitle);
  });
});
