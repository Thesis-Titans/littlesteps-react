import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listObservations, recordObservation, updateObservation } from "./api";
import { dateProblem, groupByDomain, latestByPrompt, noteExcerpt, observedText, todayIso } from "./logic";
import { MILESTONE_PROMPTS } from "./prompts";

vi.mock("../../services/firebase", () => ({ auth: { currentUser: { getIdToken: async () => "tok" } } }));

const ok = (body: unknown, status = 200) => ({ ok: true, status, json: async () => body });
const CHILD = "6f1c344e-84a8-4e24-9d72-74739a8c1362";

describe("milestones api", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue(ok([]));
    vi.stubGlobal("fetch", fetchMock);
    import.meta.env.VITE_API_BASE_URL = "https://api.littlesteps.local";
  });

  it("lists, records and updates against the contract paths", async () => {
    await listObservations(CHILD);
    await recordObservation(CHILD, "ms-1", { status: "observed", observedDate: "2026-10-21", notes: "n" });
    await updateObservation(CHILD, "obs-uuid", { status: "not_sure", observedDate: "2026-10-22" });
    const [list, post, patch] = fetchMock.mock.calls;
    expect(list[0]).toBe(`https://api.littlesteps.local/api/v1/children/${CHILD}/milestones`);
    expect(post[1].method).toBe("POST");
    expect(JSON.parse(post[1].body)).toEqual({ milestoneId: "ms-1", status: "observed", observedDate: "2026-10-21", notes: "n" });
    expect(patch[0]).toBe(`https://api.littlesteps.local/api/v1/children/${CHILD}/milestones/obs-uuid`);
    expect(patch[1].method).toBe("PATCH");
  });
});

describe("milestone logic", () => {
  const o = (id: string, milestoneId: string, updatedAt: string) =>
    ({ id, milestoneId, updatedAt, status: "observed", observedDate: "2026-10-21" }) as never;

  it("keeps the newest record per prompt", () => {
    expect(latestByPrompt([o("a", "m", "2026-10-01"), o("b", "m", "2026-10-02")]).get("m")).toMatchObject({ id: "b" });
  });

  it("shows only the two allowed status lines", () => {
    expect(observedText(undefined)).toBe("Not seen yet");
    expect(observedText({ status: "not_sure", observedDate: "2026-10-21" } as never)).toBe("Not seen yet");
    expect(observedText({ status: "observed", observedDate: "2026-10-21" } as never)).toBe("Seen on Oct 21, 2026");
  });

  it("groups in a fixed order and rejects missing or future dates", () => {
    expect(groupByDomain(MILESTONE_PROMPTS).map((g) => g.domain)).toEqual(["cognitive", "motor", "language", "socioEmotional"]);
    expect(dateProblem("")).toBeTruthy();
    expect(dateProblem("2999-01-01")).toBeTruthy();
    expect(dateProblem(todayIso())).toBeUndefined();
  });
});

describe("todayIso around midnight", () => {
  const oldTz = process.env.TZ;
  afterEach(() => {
    vi.useRealTimers();
    if (oldTz === undefined) delete process.env.TZ;
    else process.env.TZ = oldTz;
  });
  const at = (tz: string, iso: string) => {
    process.env.TZ = tz;
    vi.useFakeTimers();
    vi.setSystemTime(new Date(iso));
    return todayIso();
  };

  it("uses the UTC date when the local date is already ahead (Manila, 04:00 on the 22nd)", () => {
    expect(at("Asia/Manila", "2026-10-21T20:00:00Z")).toBe("2026-10-21");
  });

  it("uses the local date when UTC is already ahead (Los Angeles, evening of the 21st)", () => {
    expect(at("America/Los_Angeles", "2026-10-22T03:00:00Z")).toBe("2026-10-21");
  });

  it("names the real limit for the UTC-8 evening case too", () => {
    at("America/Los_Angeles", "2026-10-22T03:00:00Z");
    expect(dateProblem("2026-10-22")).toContain("latest date you can pick is Oct 21, 2026");
  });

  it("accepts a date and rejects the next day at that moment", () => {
    at("Asia/Manila", "2026-10-21T20:00:00Z");
    expect(dateProblem("2026-10-21")).toBeUndefined();
    expect(dateProblem("2026-10-22")).toBe("We can't save a date that's still ahead of today's date. The latest date you can pick is Oct 21, 2026.");
  });
});

describe("noteExcerpt", () => {
  it("keeps short notes and cuts long ones at a word", () => {
    expect(noteExcerpt("short")).toBe("short");
    expect(noteExcerpt("word ".repeat(60))).toMatch(/word…$/);
  });
});
