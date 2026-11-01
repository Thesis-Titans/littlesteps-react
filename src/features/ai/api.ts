import { ApiError, apiFetch } from "../../services/api";
import { filterFallbackActivities } from "../catalog/api";
import type { RecommendationRequest, RecommendationResponse } from "./types";

export async function getAiRecommendations(
  request: RecommendationRequest
): Promise<RecommendationResponse> {
  const payload: Record<string, unknown> = {
    ageBand: request.ageBand,
    timeMinutes: request.timeMinutes,
    language: request.language,
    setting: request.setting ?? "either",
    count: request.count ?? 3,
  };

  if (request.domain) {
    payload.domain = request.domain;
  }
  if (request.materials && request.materials.length > 0) {
    payload.materials = request.materials.slice(0, 10).map((m) => m.slice(0, 40));
  }

  const response = await apiFetch("/api/v1/ai/recommendations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return (await response.json()) as RecommendationResponse;
}

export function buildDeterministicFallback(
  request: RecommendationRequest,
  reasonMessage?: string
): RecommendationResponse {
  const { items } = filterFallbackActivities({
    ageBand: request.ageBand,
    domain: request.domain,
    setting: request.setting,
    limit: request.count ?? 3,
  });

  return {
    suggestions: items.map((activity) => ({
      activityId: activity.id,
      title: activity.title,
      whyPicked:
        reasonMessage ??
        "A good fit for this age, with the time and play space you have.",
      activity,
    })),
    source: "catalog_fallback",
    tier: 3,
    provenance: {
      badge: null,
      label: "Our picks",
      disclaimer: "Observational play suggestion only. Not developmental assessment.",
      model: null,
      reviewed: true,
    },
  };
}

export { ApiError };
