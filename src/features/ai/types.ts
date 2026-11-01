import type { AgeBand } from "../children/types";
import type { CatalogActivity, Domain, Setting } from "../catalog/types";

export interface RecommendationRequest {
  ageBand: AgeBand;
  domain?: Domain;
  setting?: Setting;
  timeMinutes: number;
  materials?: string[];
  language: "en" | "fil" | "hil";
  count?: number;
}

export interface Suggestion {
  activityId: string;
  title: string;
  whyPicked: string;
  activity: CatalogActivity;
}

export interface Provenance {
  badge: "Suggested by AI" | null;
  label: "Our picks" | null;
  disclaimer: string;
  guidance?: string;
  model: string | null;
  reviewed: true;
}

export interface RecommendationResponse {
  suggestions: Suggestion[];
  source: "ai" | "catalog_fallback";
  tier: 1 | 2 | 3;
  provenance: Provenance;
  reason?: "NO_REVIEWED_CONTENT";
}
