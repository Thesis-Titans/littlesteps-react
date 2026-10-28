import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch, getCurrentUser, getApiHealth, UnauthorizedError } from "./api";
import { auth } from "./firebase";

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

describe("apiFetch", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    import.meta.env.VITE_API_BASE_URL = "https://api.littlesteps.local";
  });

  it("attaches Authorization header when user is signed in", async () => {
    const getIdTokenMock = vi.fn().mockResolvedValue("sample-id-token");
    // @ts-expect-error mocking currentUser on auth instance
    auth.currentUser = { getIdToken: getIdTokenMock };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200
    });
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/api/v1/me");

    expect(getIdTokenMock).toHaveBeenCalledWith(false);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.littlesteps.local/api/v1/me",
      expect.objectContaining({
        headers: expect.any(Headers)
      })
    );
    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer sample-id-token");
  });

  it("does not attach Authorization header when user is signed out", async () => {
    // @ts-expect-error clearing currentUser
    auth.currentUser = null;

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200
    });
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/health");
    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.get("Authorization")).toBeNull();
  });

  it("retries once with forceRefresh on 401 when user is present", async () => {
    const getIdTokenMock = vi
      .fn()
      .mockResolvedValueOnce("expired-token")
      .mockResolvedValueOnce("fresh-token");
    // @ts-expect-error mocking currentUser
    auth.currentUser = { getIdToken: getIdTokenMock };

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 401 })
      .mockResolvedValueOnce({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    const response = await apiFetch("/api/v1/me");
    expect(response.status).toBe(200);
    expect(getIdTokenMock).toHaveBeenCalledTimes(2);
    expect(getIdTokenMock).toHaveBeenNthCalledWith(1, false);
    expect(getIdTokenMock).toHaveBeenNthCalledWith(2, true);
  });

  it("throws UnauthorizedError when request remains 401 after refresh", async () => {
    const getIdTokenMock = vi.fn().mockResolvedValue("invalid-token");
    // @ts-expect-error mocking currentUser
    auth.currentUser = { getIdToken: getIdTokenMock };

    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 401 });
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiFetch("/api/v1/me")).rejects.toBeInstanceOf(UnauthorizedError);
  });
});

describe("getCurrentUser", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    import.meta.env.VITE_API_BASE_URL = "https://api.littlesteps.local";
  });

  it("returns { uid } from the /me response", async () => {
    // @ts-expect-error clearing currentUser
    auth.currentUser = null;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ uid: "caregiver-123" })
    });
    vi.stubGlobal("fetch", fetchMock);

    const user = await getCurrentUser();
    expect(user).toEqual({ uid: "caregiver-123" });
  });

  it("throws when payload does not contain a string uid", async () => {
    // @ts-expect-error clearing currentUser
    auth.currentUser = null;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ unexpected: true })
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getCurrentUser()).rejects.toThrow("API returned an unexpected account response.");
  });
});
