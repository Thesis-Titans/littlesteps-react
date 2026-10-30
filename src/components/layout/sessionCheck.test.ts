import { describe, expect, it, vi } from "vitest";
import { checkSession } from "./sessionCheck";

const api = vi.hoisted(() => {
  class UnauthorizedError extends Error {
    constructor() {
      super("Your session has ended. Please sign in again.");
    }
  }
  class ApiError extends Error {
    status = 500;
  }
  return { getCurrentUser: vi.fn(), UnauthorizedError, ApiError };
});
vi.mock("../../services/api", () => api);

describe("checkSession", () => {
  it("signs out with a notice when the API rejects the session", async () => {
    api.getCurrentUser.mockRejectedValueOnce(new api.UnauthorizedError());
    const signOut = vi.fn().mockResolvedValue(undefined);
    await expect(checkSession(signOut)).resolves.toEqual({ notice: "Your session has ended. Please sign in again." });
    expect(signOut).toHaveBeenCalledOnce();
  });

  it("reports offline only when the browser is offline, and other failures as an error, without signing out", async () => {
    const signOut = vi.fn();
    api.getCurrentUser.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await expect(checkSession(signOut)).resolves.toEqual({ problem: "error" });
    vi.stubGlobal("navigator", { onLine: false });
    api.getCurrentUser.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await expect(checkSession(signOut)).resolves.toEqual({ problem: "offline" });
    vi.unstubAllGlobals();
    api.getCurrentUser.mockRejectedValueOnce(new Error("HTTP 500"));
    await expect(checkSession(signOut)).resolves.toEqual({ problem: "error" });
    expect(signOut).not.toHaveBeenCalled();
  });

  it("reports nothing when the session is accepted", async () => {
    api.getCurrentUser.mockResolvedValueOnce({ uid: "u1" });
    await expect(checkSession(vi.fn())).resolves.toEqual({});
  });
});
