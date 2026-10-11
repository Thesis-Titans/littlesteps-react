import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getApiHealth } from "./api";

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
