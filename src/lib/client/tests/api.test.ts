import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest, unwrapApiResponse } from "../api";
import { getSession, setSession } from "@/lib/client/session";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("unwrapApiResponse", () => {
  it("returns data when response is successful", () => {
    const result = unwrapApiResponse({
      data: { ok: true },
      error: null,
      status: 200,
    });

    expect(result).toEqual({ ok: true });
  });

  it("throws error message when api error exists", () => {
    expect(() =>
      unwrapApiResponse({
        data: null,
        error: { code: "x", message: "Boom" },
        status: 400,
      }),
    ).toThrowError("Boom");
  });

  it("throws fallback when no error payload exists", () => {
    expect(() =>
      unwrapApiResponse(
        {
          data: null,
          error: null,
          status: 500,
        },
        "Fallback",
      ),
    ).toThrowError("Fallback");
  });
});

describe("apiRequest", () => {
  it("sends GET with default headers and returns wrapped data", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { id: "1" } }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await apiRequest<{ id: string }>("/api/example");

    expect(fetchMock).toHaveBeenCalledWith("/api/example", {
      method: "GET",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: undefined,
    });
    expect(response).toEqual({
      data: { id: "1" },
      error: null,
      status: 200,
    });
  });

  it("adds authorization header when session token is provided", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { ok: true } }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await apiRequest<{ ok: boolean }>("/api/example", {
      session: { accessToken: "token-1" },
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/example", {
      method: "GET",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-1",
      },
      body: undefined,
    });
  });

  it("serializes request body for mutations", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { created: true } }), { status: 201 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await apiRequest<{ created: boolean }>("/api/example", {
      method: "POST",
      body: { name: "x" },
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/example", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "x" }),
    });
  });

  it("returns structured error payload for non-ok response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { code: "bad_request", message: "Invalid payload" },
        }),
        { status: 400 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await apiRequest("/api/example");

    expect(response).toEqual({
      data: null,
      error: { code: "bad_request", message: "Invalid payload" },
      status: 400,
    });
  });

  it("uses fallback error payload when response body is not json", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("not-json", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await apiRequest("/api/example");

    expect(response).toEqual({
      data: null,
      error: { code: "request_failed", message: "Request failed" },
      status: 500,
    });
  });

  it("clears local session on auth 401 invalid_token", async () => {
    setSession({ accessToken: "token-1" });

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { code: "invalid_token", message: "Access token is invalid or expired." },
        }),
        { status: 401 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await apiRequest("/api/me", {
      session: { accessToken: "token-1" },
    });

    expect(response).toEqual({
      data: null,
      error: { code: "invalid_token", message: "Access token is invalid or expired." },
      status: 401,
    });
    expect(getSession()).toBeNull();
  });
});
