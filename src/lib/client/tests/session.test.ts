import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession, getSession, setSession } from "@/lib/client/session";

function toBase64Url(value: string): string {
  return window
    .btoa(value)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function buildJwtWithExp(exp: number): string {
  const header = toBase64Url(JSON.stringify({ alg: "none", typ: "JWT" }));
  const payload = toBase64Url(JSON.stringify({ exp }));
  return `${header}.${payload}.sig`;
}

describe("client session storage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-15T12:00:00.000Z"));
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null when no session is stored", () => {
    expect(getSession()).toBeNull();
  });

  it("returns stored session when it is valid", () => {
    setSession({
      accessToken: "token-1",
      expiresAt: Math.floor(Date.now() / 1000) + 60,
    });

    expect(getSession()).toEqual({
      accessToken: "token-1",
      expiresAt: Math.floor(Date.now() / 1000) + 60,
    });
  });

  it("removes and returns null for expired session (epoch seconds)", () => {
    setSession({
      accessToken: "token-1",
      expiresAt: Math.floor(Date.now() / 1000) - 1,
    });

    expect(getSession()).toBeNull();
    expect(window.localStorage.getItem("pnp.session")).toBeNull();
  });

  it("removes and returns null for expired session (epoch milliseconds)", () => {
    setSession({
      accessToken: "token-1",
      expiresAt: Date.now() - 1,
    });

    expect(getSession()).toBeNull();
    expect(window.localStorage.getItem("pnp.session")).toBeNull();
  });

  it("removes and returns null for expired session when expiresAt is missing but jwt exp is expired", () => {
    const expiredExp = Math.floor(Date.now() / 1000) - 1;
    setSession({
      accessToken: buildJwtWithExp(expiredExp),
    });

    expect(getSession()).toBeNull();
    expect(window.localStorage.getItem("pnp.session")).toBeNull();
  });

  it("clearSession removes stored session", () => {
    setSession({ accessToken: "token-1" });
    clearSession();

    expect(getSession()).toBeNull();
  });
});
