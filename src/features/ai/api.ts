import { ApiError, apiFetch } from "../../services/api";
import { filterFallbackActivities } from "../catalog/api";
import type {
  AdaptActivityRequest,
  AdaptActivityResponse,
  RecommendationRequest,
  RecommendationResponse,
  StoryActivityRequest,
  StoryActivityResponse,
} from "./types";

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
  reasonMessage?: string,
  offset = 0
): RecommendationResponse {
  const { items } = filterFallbackActivities({
    ageBand: request.ageBand,
    domain: request.domain,
    setting: request.setting,
  });

  // Score candidate items based on matching materials if specified
  const requestedMaterials = (request.materials ?? [])
    .map((m) => m.toLowerCase().trim())
    .filter(Boolean);
  const sortedItems = [...items];
  if (requestedMaterials.length > 0) {
    sortedItems.sort((a, b) => {
      const aMatches = a.materials.filter((m) =>
        requestedMaterials.some((rm) => m.toLowerCase().includes(rm))
      ).length;
      const bMatches = b.materials.filter((m) =>
        requestedMaterials.some((rm) => m.toLowerCase().includes(rm))
      ).length;
      return bMatches - aMatches;
    });
  }

  const count = request.count ?? 3;
  let selected = sortedItems;
  if (sortedItems.length > count) {
    const start = offset % sortedItems.length;
    selected = [...sortedItems.slice(start), ...sortedItems.slice(0, start)].slice(0, count);
  } else {
    selected = sortedItems.slice(0, count);
  }

  return {
    suggestions: selected.map((activity) => ({
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

export async function fetchStoryActivity(
  request: StoryActivityRequest
): Promise<StoryActivityResponse> {
  const response = await apiFetch("/api/v1/ai/story-activity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bookTitle: request.bookTitle,
      subjects: request.subjects ?? [],
      ageBand: request.ageBand,
    }),
  });
  return (await response.json()) as StoryActivityResponse;
}

export async function adaptActivity(
  request: AdaptActivityRequest
): Promise<AdaptActivityResponse> {
  const payload: Record<string, unknown> = {
    activityId: request.activityId,
    adjustment: request.adjustment,
  };
  if (request.missingMaterial) {
    payload.missingMaterial = request.missingMaterial.slice(0, 60);
  }
  if (request.ageBand) {
    payload.ageBand = request.ageBand;
  }

  const response = await apiFetch("/api/v1/ai/adapt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return (await response.json()) as AdaptActivityResponse;
}

export { ApiError };
