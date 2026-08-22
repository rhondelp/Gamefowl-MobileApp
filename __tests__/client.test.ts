/**
 * Tests for services/api/client.ts — the app's single network choke point.
 * fetch is mocked; these pin envelope parsing, error normalization, and the
 * central 401 session-expiry hook (Milestone 13 hardening).
 */
import { ApiError, request, setUnauthorizedHandler } from "../services/api/client";

/** Mock a JSON response. */
function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

/** Mock a non-JSON (plain text) response, e.g. the rate limiter's 429. */
function textResponse(status: number, body: string) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => body,
  } as unknown as Response;
}

afterEach(() => {
  setUnauthorizedHandler(null);
  jest.restoreAllMocks();
});

describe("request — success path", () => {
  it("returns the parsed data payload on success", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      jsonResponse(200, {
        success: true,
        message: "Gamefowls retrieved successfully.",
        data: { items: [{ id: 1 }], pagination: { total: 1 } },
      })
    );

    const data = await request<{ items: unknown[] }>("/gamefowls", { token: "t" });
    expect(data.items).toHaveLength(1);
  });
});

describe("request — error normalization", () => {
  it("throws ApiError with backend message + field errors on failure envelopes", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      jsonResponse(422, {
        success: false,
        message: "Validation failed.",
        errors: { name: ["The name field is required."] },
      })
    );

    const promise = request("/gamefowls", {
      method: "POST",
      body: {},
      token: "t",
    });
    await expect(promise).rejects.toThrow(ApiError);
    await promise.catch((error: ApiError) => {
      expect(error.status).toBe(422);
      expect(error.message).toBe("Validation failed.");
      expect(error.fieldErrors?.name?.[0]).toBe("The name field is required.");
    });
  });

  it("falls back to a status-based message when the body is not JSON", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(textResponse(500, "Server error"));

    await expect(request("/gamefowls", { token: "t" })).rejects.toMatchObject({
      status: 500,
    });
  });

  it("converts network failures into an actionable status-0 ApiError", async () => {
    jest.spyOn(global, "fetch").mockRejectedValue(new TypeError("Network failure"));

    const promise = request("/gamefowls");
    await expect(promise).rejects.toThrow(ApiError);
    await promise.catch((error: ApiError) => {
      expect(error.status).toBe(0);
      expect(error.message).toContain("Cannot reach the server");
    });
  });
});

describe("central 401 session-expiry handling", () => {
  it("fires the unauthorized handler once when a tokened request gets 401", async () => {
    const handler = jest.fn();
    setUnauthorizedHandler(handler);
    const spy = jest
      .spyOn(global, "fetch")
      .mockResolvedValue(jsonResponse(401, { success: false, message: "Unauthenticated." }));

    await expect(request("/gamefowls/7", { token: "dead-token" })).rejects.toThrow(
      ApiError
    );
    expect(handler).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("does NOT fire the handler when a tokenless login fails with 401", async () => {
    const handler = jest.fn();
    setUnauthorizedHandler(handler);
    jest.spyOn(global, "fetch").mockResolvedValue(
      jsonResponse(401, { success: false, message: "Invalid credentials." })
    );

    // Wrong credentials are NOT session expiry.
    await expect(
      request("/auth/login", { method: "POST", body: {} })
    ).rejects.toThrow(ApiError);
    expect(handler).not.toHaveBeenCalled();
  });

  it("does not fire the handler for non-401 failures even with a token", async () => {
    const handler = jest.fn();
    setUnauthorizedHandler(handler);
    jest.spyOn(global, "fetch").mockResolvedValue(
      jsonResponse(403, { success: false, message: "Forbidden." })
    );

    await expect(request("/admin/dashboard", { token: "owner-token" })).rejects.toThrow(
      ApiError
    );
    expect(handler).not.toHaveBeenCalled();
  });
});
