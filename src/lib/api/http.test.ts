import { describe, expect, it } from "vitest";
import { jsonError, jsonOk, parseJsonBody } from "./http";

describe("http helpers", () => {
  it("jsonOk wraps data with status", async () => {
    const response = jsonOk({ ok: true }, 201);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({ data: { ok: true } });
  });

  it("jsonError wraps error body with status", async () => {
    const response = jsonError(400, "invalid", "Invalid payload");
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: {
        code: "invalid",
        message: "Invalid payload",
      },
    });
  });

  it("parseJsonBody returns typed payload", async () => {
    const request = new Request("http://localhost/api/test", {
      method: "POST",
      body: JSON.stringify({ name: "alpha" }),
    });

    const body = await parseJsonBody<{ name: string }>(request);
    expect(body).toEqual({ name: "alpha" });
  });

  it("parseJsonBody returns null for invalid json", async () => {
    const request = new Request("http://localhost/api/test", {
      method: "POST",
      body: "not-json",
    });

    const body = await parseJsonBody<{ name: string }>(request);
    expect(body).toBeNull();
  });
});
