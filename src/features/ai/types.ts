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
  allowCustom?: boolean;
}

export interface Suggestion {
  activityId: string;
  title: string;
  whyPicked: string;
  activity: CatalogActivity;
  isCustom?: boolean;
}

export interface Provenance {
  badge: "Suggested by AI" | null;
  label: "Our picks" | "Material adaptation" | null;
  disclaimer: string;
  guidance?: string;
  model: string | null;
  reviewed: boolean;
}

export interface RecommendationResponse {
  suggestions: Suggestion[];
  source: "ai" | "ai_custom" | "catalog_fallback";
  tier: 1 | 2 | 3;
  provenance: Provenance;
  reason?: "NO_REVIEWED_CONTENT";
  materialNote?: string;
}

export interface StoryActivityRequest {
  bookTitle: string;
  subjects?: string[];
  ageBand: AgeBand;
}

export interface StoryActivitySuggestion {
  title: string;
  domain: string;
  instructions: string;
  safetyNotice: string;
}

export interface StoryActivityResponse {
  bookTitle: string;
  suggestion: StoryActivitySuggestion;
  provenance: {
    tier: 1 | 2 | 3;
    source: string;
    badge: "Suggested by AI" | null;
    disclaimer: string;
  };
}

export type ActivityAdjustment = "shorter" | "easier" | "harder" | "missing_material";

export interface AdaptActivityRequest {
  activityId: string;
  adjustment: ActivityAdjustment;
  missingMaterial?: string;
  ageBand?: string;
}

export interface AdaptedActivitySuggestion {
  activityId: string;
  originalTitle: string;
  adaptedTitle: string;
  /** Optional fallback title field returned by alternate payload versions. */
  title?: string;
  adjustment: ActivityAdjustment;
  /** Optional adjusted duration in minutes. */
  durationMinutes?: number;
  instructions: string[];
  materials: string[];
  safetyNotice: string;
  explanation: string;
  /** Optional fallback rationale field returned by alternate payload versions. */
  whyItWorks?: string;
}

export interface AdaptActivityResponse {
  adapted: AdaptedActivitySuggestion;
  source: "ai" | "fallback";
  tier: 1 | 2;
  provenance: {
    badge: "Suggested by AI" | null;
    disclaimer: string;
    model: string | null;
  };
}


