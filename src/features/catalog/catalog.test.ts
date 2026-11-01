import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  fetchCatalogActivities,
  fetchCatalogActivityById,
  filterFallbackActivities,
} from "./api";
import {
  FALLBACK_CATALOG_ACTIVITIES,
  SOURCE_ATTRIBUTION_FALLBACK,
} from "./fallbackData";
import {
  DOMAIN_LABELS,
  DOMAINS,
  SETTING_LABELS,
} from "./types";
import { AGE_BANDS } from "../children/types";
import * as apiModule from "../../services/api";

describe("catalog domain and setting vocabulary", () => {
  it("maps domains to parent-friendly vocabulary per UI/UX Spec §2.6", () => {
    expect(DOMAIN_LABELS.cognitive).toBe("Thinking");
    expect(DOMAIN_LABELS.motor).toBe("Moving");
    expect(DOMAIN_LABELS.language).toBe("Talking");
    expect(DOMAIN_LABELS.socioEmotional).toBe("Feelings");
  });

  it("maps settings to clear everyday places", () => {
    expect(SETTING_LABELS.indoor).toBe("Indoor");
    expect(SETTING_LABELS.outdoor).toBe("Outdoor");
    expect(SETTING_LABELS.either).toBe("Indoor or outdoor");
  });
});

describe("fallback catalog data integrity", () => {
  it("includes content covering all 7 age bands", () => {
    const presentBands = new Set(FALLBACK_CATALOG_ACTIVITIES.map((a) => a.ageBand));
    for (const band of AGE_BANDS) {
      expect(presentBands.has(band)).toBe(true);
    }
  });

  it("includes content covering all 4 developmental domains", () => {
    const presentDomains = new Set(FALLBACK_CATALOG_ACTIVITIES.map((a) => a.domain));
    for (const domain of DOMAINS) {
      expect(presentDomains.has(domain)).toBe(true);
    }
  });

  it("ensures all activities have valid step-by-step instructions and provenance", () => {
    for (const act of FALLBACK_CATALOG_ACTIVITIES) {
      expect(act.instructions.length).toBeGreaterThanOrEqual(1);
      expect(act.durationMinutes).toBeGreaterThanOrEqual(5);
      expect(act.provenanceSource).toBe(SOURCE_ATTRIBUTION_FALLBACK);
      expect(act.limitations).toContain("Not developmental assessment");
    }
  });

  it("strictly enforces zero AI buzzwords or slop across all fallback content", () => {
    const banned = ["delve", "supercharge", "seamless", "smart", "magic"];
    for (const act of FALLBACK_CATALOG_ACTIVITIES) {
      const fullText = [
        act.title,
        ...act.instructions,
        ...act.materials,
        act.limitations,
      ]
        .join(" ")
        .toLowerCase();

      for (const word of banned) {
        expect(fullText.includes(word)).toBe(false);
      }
    }
  });

  it("strictly enforces non-diagnostic calm language across all fallback content", () => {
    const bannedClinical = [
      "delayed",
      "behind",
      "late",
      "on track",
      "normal",
      "at risk",
      "red flag",
      "score",
      "pass/fail",
      "screening",
    ];

    for (const act of FALLBACK_CATALOG_ACTIVITIES) {
      const fullText = [
        act.title,
        ...act.instructions,
        act.limitations,
      ]
        .join(" ")
        .toLowerCase();

      for (const term of bannedClinical) {
        expect(fullText.includes(term)).toBe(false);
      }
    }
  });
});

describe("filterFallbackActivities", () => {
  it("filters activities by age band", () => {
    const res = filterFallbackActivities({ ageBand: "12-23m" });
    expect(res.total).toBeGreaterThan(0);
    expect(res.items.every((item) => item.ageBand === "12-23m")).toBe(true);
  });

  it("filters activities by domain", () => {
    const res = filterFallbackActivities({ domain: "motor" });
    expect(res.total).toBeGreaterThan(0);
    expect(res.items.every((item) => item.domain === "motor")).toBe(true);
  });

  it("filters activities by setting while including either", () => {
    const res = filterFallbackActivities({ setting: "indoor" });
    expect(res.total).toBeGreaterThan(0);
    expect(
      res.items.every((item) => item.setting === "indoor" || item.setting === "either")
    ).toBe(true);
  });

  it("respects the limit parameter", () => {
    const res = filterFallbackActivities({ limit: 2 });
    expect(res.items.length).toBeLessThanOrEqual(2);
  });
});

describe("fetchCatalogActivities API client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("calls /api/v1/catalog/activities with query parameters", async () => {
    const fakeResponse = {
      total: 1,
      items: [FALLBACK_CATALOG_ACTIVITIES[0]],
    };

    const spy = vi.spyOn(apiModule, "apiFetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => fakeResponse,
    } as unknown as Response);

    const result = await fetchCatalogActivities({
      ageBand: "12-23m",
      domain: "motor",
      setting: "indoor",
      limit: 10,
    });

    expect(result).toEqual(fakeResponse);
    expect(spy).toHaveBeenCalledWith(
      "/api/v1/catalog/activities?ageBand=12-23m&domain=motor&setting=indoor&limit=10"
    );
  });

  it("calls /api/v1/catalog/activities/:id by activity ID", async () => {
    const fakeActivity = FALLBACK_CATALOG_ACTIVITIES[0];

    const spy = vi.spyOn(apiModule, "apiFetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => fakeActivity,
    } as unknown as Response);

    const result = await fetchCatalogActivityById("act-tummy-mirror");
    expect(result).toEqual(fakeActivity);
    expect(spy).toHaveBeenCalledWith("/api/v1/catalog/activities/act-tummy-mirror");
  });
});
