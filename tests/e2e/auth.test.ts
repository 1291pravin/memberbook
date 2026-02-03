import { describe, it, expect } from "vitest";
import { setup, fetch } from "@nuxt/test-utils/e2e";
import { registerUser, loginUser, rawFetch, extractCookies } from "../helpers/auth";
import { makeUser } from "../helpers/data";

describe("Auth API", async () => {
  await setup({});

  const user = makeUser();

  describe("POST /api/auth/register", () => {
    it("registers a user and sets session cookie", async () => {
      const res = await rawFetch("/api/auth/register", {
        method: "POST",
        body: user,
      });
      expect(res.status).toBe(200);
      const cookies = extractCookies(res.headers);
      expect(cookies).toContain("nuxt-session");
      const body = await res.json();
      expect(body.user.email).toBe(user.email);
    });

    it("returns 400 when missing fields", async () => {
      const res = await rawFetch("/api/auth/register", {
        method: "POST",
        body: { email: "a@b.com" },
      });
      expect(res.status).toBe(400);
    });

    it("returns 400 when password is too short", async () => {
      const res = await rawFetch("/api/auth/register", {
        method: "POST",
        body: { email: "short@test.com", password: "abc", name: "Short" },
      });
      expect(res.status).toBe(400);
    });

    it("returns 409 when email already exists", async () => {
      const res = await rawFetch("/api/auth/register", {
        method: "POST",
        body: user,
      });
      expect(res.status).toBe(409);
    });
  });

  describe("POST /api/auth/login", () => {
    it("logs in with valid credentials", async () => {
      const res = await rawFetch("/api/auth/login", {
        method: "POST",
        body: { email: user.email, password: user.password },
      });
      expect(res.status).toBe(200);
      const cookies = extractCookies(res.headers);
      expect(cookies).toContain("nuxt-session");
      const body = await res.json();
      expect(body.user.email).toBe(user.email);
    });

    it("returns 401 for wrong password", async () => {
      const res = await rawFetch("/api/auth/login", {
        method: "POST",
        body: { email: user.email, password: "wrongpassword" },
      });
      expect(res.status).toBe(401);
    });

    it("returns 401 for non-existent email", async () => {
      const res = await rawFetch("/api/auth/login", {
        method: "POST",
        body: { email: "nobody@test.com", password: "anything" },
      });
      expect(res.status).toBe(401);
    });

    it("returns 400 when missing fields", async () => {
      const res = await rawFetch("/api/auth/login", {
        method: "POST",
        body: { email: user.email },
      });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("clears session and subsequent auth request fails", async () => {
      const session = await loginUser({ email: user.email, password: user.password });

      const logoutRes = await rawFetch("/api/auth/logout", {
        method: "POST",
        headers: { cookie: session.cookies },
      });
      expect(logoutRes.status).toBe(200);
      const logoutBody = await logoutRes.json();
      expect(logoutBody.success).toBe(true);

      // Use the cookies returned by logout (cleared session cookie)
      const logoutCookies = extractCookies(logoutRes.headers);
      const orgsRes = await fetch("/api/orgs/", {
        headers: { cookie: logoutCookies },
      });
      expect(orgsRes.status).toBe(401);
    });
  });
});
