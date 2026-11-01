import { apiFetch } from "../../services/api";
import { FALLBACK_CATALOG_ACTIVITIES } from "./fallbackData";
import type {
  CatalogActivitiesQuery,
  CatalogActivitiesResponse,
  CatalogActivity,
} from "./types";

export async function fetchCatalogActivities(
  query: CatalogActivitiesQuery = {}
): Promise<CatalogActivitiesResponse> {
  const params = new URLSearchParams();
  if (query.ageBand) params.set("ageBand", query.ageBand);
  if (query.domain) params.set("domain", query.domain);
  if (query.type) params.set("type", query.type);
  if (query.language) params.set("language", query.language);
  if (query.setting) params.set("setting", query.setting);
  if (query.limit) params.set("limit", String(query.limit));

  const qs = params.toString();
  const path = `/api/v1/catalog/activities${qs ? `?${qs}` : ""}`;

  const response = await apiFetch(path);
  const data = (await response.json()) as CatalogActivitiesResponse;
  return data;
}

export async function fetchCatalogActivityById(id: string): Promise<CatalogActivity> {
  const response = await apiFetch(`/api/v1/catalog/activities/${encodeURIComponent(id)}`);
  const data = (await response.json()) as CatalogActivity;
  return data;
}

/** Local deterministic filter for offline use or local fallback */
export function filterFallbackActivities(
  query: CatalogActivitiesQuery = {}
): CatalogActivitiesResponse {
  let items = [...FALLBACK_CATALOG_ACTIVITIES];

  if (query.ageBand) {
    items = items.filter((item) => item.ageBand === query.ageBand);
  }
  if (query.domain) {
    items = items.filter((item) => item.domain === query.domain);
  }
  if (query.setting && query.setting !== "either") {
    items = items.filter(
      (item) => item.setting === query.setting || item.setting === "either"
    );
  }
  if (query.language) {
    items = items.filter((item) => item.language === query.language);
  }

  const limit = query.limit ?? items.length;
  return {
    total: items.length,
    items: items.slice(0, limit),
  };
}
