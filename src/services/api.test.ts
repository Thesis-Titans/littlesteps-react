import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch, getCurrentUser, getApiHealth, UnauthorizedError } from "./api";

const mockAuth = vi.hoisted(() => ({
  currentUser: null as { getIdToken: (forceRefresh?: boolean) => Promise<string> } | null
}));
vi.mock("./firebase", () => ({ auth: mockAuth }));

describe("getApiHealth", () => {
  const originalEnv = import.meta.env.VITE_API_BASE_URL;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    import.meta.env.VITE_API_BASE_URL = originalEnv;
  });

  it("throws an error if VITE_API_BASE_URL is not configured", async () => {
    import.meta.env.VITE_API_BASE_URL = "";
    await expect(getApiHealth()).rejects.toThrow("Set VITE_API_BASE_URL in .env.local first.");
  });

  it("returns { status: 'ok' } on successful health check", async () => {
    import.meta.env.VITE_API_BASE_URL = "https://api.littlesteps.local";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: "ok" })
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await getApiHealth();
    expect(result).toEqual({ status: "ok" });
    expect(fetchMock).toHaveBeenCalledWith("https://api.littlesteps.local/health", {
      headers: { Accept: "application/json" },
      cache: "no-store"
    });
  });

  it("throws an error when HTTP status is not ok", async () => {
    import.meta.env.VITE_API_BASE_URL = "https://api.littlesteps.local";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getApiHealth()).rejects.toThrow("API health check failed (HTTP 503).");
  });

  it("throws an error when response payload is malformed", async () => {
    import.meta.env.VITE_API_BASE_URL = "https://api.littlesteps.local";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: "unexpected" })
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getApiHealth()).rejects.toThrow("API returned an unexpected health response.");
  });
});

describe("apiFetch & getCurrentUser", () => {
  const originalEnv = import.meta.env.VITE_API_BASE_URL;

  beforeEach(() => {
    vi.restoreAllMocks();
    import.meta.env.VITE_API_BASE_URL = "https://api.littlesteps.local";
    mockAuth.currentUser = null;
  });

  afterEach(() => {
    import.meta.env.VITE_API_BASE_URL = originalEnv;
  });

  function jsonResponse(status: number, body?: unknown) {
    return { ok: status >= 200 && status < 300, status, json: async () => body };
  }

  it("attaches the caregiver's ID token as a bearer token", async () => {
    mockAuth.currentUser = { getIdToken: vi.fn().mockResolvedValue("id-token-1") };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { uid: "caregiver-1" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getCurrentUser()).resolves.toEqual({ uid: "caregiver-1" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.littlesteps.local/api/v1/me");
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer id-token-1");
  });

  it("sends no Authorization header when signed out and throws UnauthorizedError on 401", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(401));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getCurrentUser()).rejects.toBeInstanceOf(UnauthorizedError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(new Headers(fetchMock.mock.calls[0][1].headers).has("Authorization")).toBe(false);
  });

  it("retries once with a refreshed token after a 401", async () => {
    const getIdToken = vi.fn(async (forceRefresh?: boolean) => (forceRefresh ? "fresh" : "stale"));
    mockAuth.currentUser = { getIdToken };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401))
      .mockResolvedValueOnce(jsonResponse(200, { uid: "caregiver-1" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getCurrentUser()).resolves.toEqual({ uid: "caregiver-1" });
    expect(getIdToken).toHaveBeenLastCalledWith(true);
    expect(new Headers(fetchMock.mock.calls[1][1].headers).get("Authorization")).toBe("Bearer fresh");
  });

  it("throws UnauthorizedError when the refreshed token is also rejected", async () => {
    mockAuth.currentUser = { getIdToken: vi.fn().mockResolvedValue("token") };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(401));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getCurrentUser()).rejects.toThrow("Your session has ended. Please sign in again.");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("rejects a malformed /me payload", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, { uid: 42 })));
    await expect(getCurrentUser()).rejects.toThrow("API returned an unexpected account response.");
  });

  it("throws when VITE_API_BASE_URL is not set for apiFetch", async () => {
    import.meta.env.VITE_API_BASE_URL = "";
    await expect(apiFetch("/health")).rejects.toThrow("Set VITE_API_BASE_URL in .env.local first.");
  });

  it("throws ApiError with code, message and details from the error envelope", async () => {
    const error = {
      code: "UNPROCESSABLE_ENTITY",
      message: "Birth month is out of range.",
      details: [{ field: "birthMonthYear", issue: "too old" }, { nope: 1 }]
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(422, { error })));

    const failure = await apiFetch("/api/v1/children").catch((e: unknown) => e);
    expect(failure).toBeInstanceOf(ApiError);
    expect(failure).toMatchObject({
      status: 422,
      code: "UNPROCESSABLE_ENTITY",
      message: "Birth month is out of range.",
      details: [{ field: "birthMonthYear", issue: "too old" }]
    });
  });

  it("throws ApiError for a 404", async () => {
    const error = { code: "RESOURCE_NOT_FOUND", message: "Not found." };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(404, { error })));
    await expect(apiFetch("/api/v1/children/x")).rejects.toMatchObject({ status: 404, code: "RESOURCE_NOT_FOUND", details: [] });
  });

  it("gives a generic ApiError for a non-JSON or envelope-less error body", async () => {
    const notJson = { ok: false, status: 502, json: async () => { throw new SyntaxError("bad"); } };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(notJson).mockResolvedValueOnce(jsonResponse(500, { oops: true })));
    for (const _ of [1, 2]) {
      await expect(apiFetch("/x")).rejects.toMatchObject({ code: undefined, message: expect.stringContaining("HTTP") });
    }
  });
});
