import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnauthorizedError } from "../../services/api";
import { createChild, getChild, listChildren, updateChild } from "./api";
import { AGE_BANDS, ageBandLabel } from "./types";

const mockAuth = vi.hoisted(() => ({
  currentUser: { getIdToken: async () => "tok" } as { getIdToken: () => Promise<string> } | null
}));
vi.mock("../../services/firebase", () => ({ auth: mockAuth }));

const child = {
  id: "6f1c344e-84a8-4e24-9d72-74739a8c1362",
  nickname: "Maya",
  ageBand: "12-23m",
  createdAt: "2026-10-29T08:00:00Z",
  updatedAt: "2026-10-29T08:00:00Z"
};
const ok = (body: unknown, status = 200) => ({ ok: true, status, json: async () => body });

describe("children api", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    import.meta.env.VITE_API_BASE_URL = "https://api.littlesteps.local";
  });

  it("lists children", async () => {
    fetchMock.mockResolvedValue(ok([child]));
    await expect(listChildren()).resolves.toEqual([child]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.littlesteps.local/api/v1/children");
    expect(init.method).toBe("GET");
    expect(init.body).toBeUndefined();
  });

  it("creates a child with a JSON body", async () => {
    fetchMock.mockResolvedValue(ok(child, 201));
    await expect(createChild({ nickname: "Maya", ageBand: "12-23m" })).resolves.toEqual(child);
    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("Content-Type")).toBe("application/json");
    expect(JSON.parse(init.body)).toEqual({ nickname: "Maya", ageBand: "12-23m" });
  });

  it("gets a child by id", async () => {
    fetchMock.mockResolvedValue(ok(child));
    await getChild(child.id);
    expect(fetchMock.mock.calls[0][0]).toBe(`https://api.littlesteps.local/api/v1/children/${child.id}`);
  });

  it("updates a child with PATCH", async () => {
    fetchMock.mockResolvedValue(ok(child));
    await updateChild(child.id, { birthMonthYear: "2025-08" });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body)).toEqual({ birthMonthYear: "2025-08" });
  });

  it("rejects with ApiError when the child is missing", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: { code: "RESOURCE_NOT_FOUND", message: "Not found." } })
    });
    await expect(getChild("nope")).rejects.toMatchObject({ name: "ApiError", status: 404 });
  });

  it("URL-encodes the child id", async () => {
    fetchMock.mockResolvedValue(ok(child));
    await getChild("a/b ?x");
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.littlesteps.local/api/v1/children/a%2Fb%20%3Fx");
  });

  it("throws UnauthorizedError after one refresh retry on 401", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401, json: async () => ({}) });
    await expect(getChild(child.id)).rejects.toBeInstanceOf(UnauthorizedError);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("rejects unexpected response shapes", async () => {
    const bad = { ...child, ageBand: "99m" };
    for (const call of [
      () => (fetchMock.mockResolvedValue(ok([child, bad])), listChildren()),
      () => (fetchMock.mockResolvedValue(ok(bad, 201)), createChild({ nickname: "M", ageBand: "12-23m" })),
      () => (fetchMock.mockResolvedValue(ok(bad)), getChild(child.id)),
      () => (fetchMock.mockResolvedValue(ok(bad)), updateChild(child.id, { nickname: "M" })),
      () => (fetchMock.mockResolvedValue(ok(null)), getChild(child.id))
    ]) {
      await expect(call()).rejects.toMatchObject({ name: "ApiError", code: "INVALID_RESPONSE" });
    }
  });

  it("labels every age band for parents", () => {
    expect(AGE_BANDS.map(ageBandLabel)).toEqual([
      "0–5 months", "6–11 months", "12–23 months", "24–35 months", "36–47 months", "48–59 months", "60–71 months"
    ]);
    expect(ageBandLabel("bogus" as never)).toBe("Age not set");
  });
});
