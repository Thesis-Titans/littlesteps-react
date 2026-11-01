import { beforeEach, describe, expect, it, vi } from "vitest";
import * as apiModule from "../../services/api";
import { buildDeterministicFallback, getAiRecommendations } from "./api";
import type { RecommendationRequest, RecommendationResponse } from "./types";

describe("buildDeterministicFallback", () => {
  const req: RecommendationRequest = {
    ageBand: "12-23m",
    domain: "cognitive",
    setting: "indoor",
    timeMinutes: 15,
    language: "en",
    count: 2,
  };

  it("builds Tier 3 deterministic catalog fallback response", () => {
    const fallback = buildDeterministicFallback(req);
    expect(fallback.source).toBe("catalog_fallback");
    expect(fallback.tier).toBe(3);
    expect(fallback.suggestions.length).toBeGreaterThan(0);
    expect(fallback.suggestions.length).toBeLessThanOrEqual(2);
  });

  it("never includes AI badge on fallback picks", () => {
    const fallback = buildDeterministicFallback(req);
    expect(fallback.provenance.badge).toBeNull();
    expect(fallback.provenance.label).toBe("Our picks");
  });

  it("always includes mandatory non-diagnostic disclaimer", () => {
    const fallback = buildDeterministicFallback(req);
    expect(fallback.provenance.disclaimer).toBe(
      "Observational play suggestion only. Not developmental assessment."
    );
  });

  it("customizes whyPicked reason when provided", () => {
    const customReason = "A favorite activity while the helper takes a short break.";
    const fallback = buildDeterministicFallback(req, customReason);
    expect(fallback.suggestions[0].whyPicked).toBe(customReason);
  });
});

describe("getAiRecommendations API client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("sends strict payload to POST /api/v1/ai/recommendations", async () => {
    const fakeResponse: RecommendationResponse = {
      suggestions: [
        {
          activityId: "act-stack-cups",
          title: "Stack the cups",
          whyPicked: "Matches the age band and the cups you have.",
          activity: {
            id: "act-stack-cups",
            title: "Stack the cups",
            type: "activity",
            language: "en",
            setting: "indoor",
            ageBand: "12-23m",
            domain: "cognitive",
            durationMinutes: 15,
            durationEstimate: "10–15 mins",
            materials: ["cups"],
            instructions: ["Stack cups"],
            provenanceSource: "Source: early learning guide · still being checked",
            status: "reviewed_approved",
            limitations: "Observational play prompt only.",
          },
        },
      ],
      source: "ai",
      tier: 1,
      provenance: {
        badge: "Suggested by AI",
        label: null,
        disclaimer: "Observational play suggestion only. Not developmental assessment.",
        guidance: "You know your child best. Change it as you like, and stay close while you play.",
        model: "gemini-2.0-flash",
        reviewed: true,
      },
    };

    const spy = vi.spyOn(apiModule, "apiFetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => fakeResponse,
    } as unknown as Response);

    const req: RecommendationRequest = {
      ageBand: "12-23m",
      timeMinutes: 15,
      language: "en",
      setting: "indoor",
      materials: ["cups", "spoon"],
      count: 3,
    };

    const result = await getAiRecommendations(req);

    expect(result).toEqual(fakeResponse);
    expect(spy).toHaveBeenCalledWith("/api/v1/ai/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ageBand: "12-23m",
        timeMinutes: 15,
        language: "en",
        setting: "indoor",
        count: 3,
        materials: ["cups", "spoon"],
      }),
    });
  });

  it("enforces materials cap (up to 10 items, 40 chars each)", async () => {
    const spy = vi.spyOn(apiModule, "apiFetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        suggestions: [],
        source: "catalog_fallback",
        tier: 3,
        provenance: {
          badge: null,
          label: "Our picks",
          disclaimer: "Observational play suggestion only. Not developmental assessment.",
          model: null,
          reviewed: true,
        },
      }),
    } as unknown as Response);

    const longItems = Array.from({ length: 15 }, (_, i) => `item-${i}-${"x".repeat(50)}`);

    await getAiRecommendations({
      ageBand: "12-23m",
      timeMinutes: 15,
      language: "en",
      materials: longItems,
    });

    const calledBody = JSON.parse(spy.mock.calls[0][1]?.body as string);
    expect(calledBody.materials.length).toBe(10);
    expect(calledBody.materials.every((m: string) => m.length <= 40)).toBe(true);
  });
});
