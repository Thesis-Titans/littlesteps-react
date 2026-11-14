import type { AgeBand } from "../children/types";

export type { AgeBand };

export const BOOK_SUBJECTS = [
  "picture_books",
  "bedtime",
  "colors",
  "animals",
] as const;
export type BookSubject = (typeof BOOK_SUBJECTS)[number];

export const BOOK_SUBJECT_LABELS: Record<BookSubject, string> = {
  picture_books: "Picture books",
  bedtime: "Bedtime",
  colors: "Colors",
  animals: "Animals",
};

export interface BookItem {
  id: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
  subjects: string[];
}

export interface BooksResponse {
  subject: string;
  totalCount: number;
  books: BookItem[];
  provenance: {
    source: string;
    license?: string;
  };
}

export const DOMAINS = ["cognitive", "motor", "language", "socioEmotional"] as const;
export type Domain = (typeof DOMAINS)[number];

export const ACTIVITY_TYPES = ["activity", "story", "rhyme", "game"] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const SETTINGS = ["indoor", "outdoor", "either"] as const;
export type Setting = (typeof SETTINGS)[number];

export const REVIEW_STATUSES = ["reviewed_approved", "synthetic_fixture", "draft"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export interface CatalogActivity {
  id: string;
  title: string;
  type: ActivityType;
  language: "en" | "fil" | "hil";
  setting: Setting;
  ageBand: AgeBand;
  domain: Domain;
  durationMinutes: number;
  durationEstimate: string;
  materials: string[];
  instructions: string[];
  provenanceSource: string;
  status: ReviewStatus;
  limitations: string;
}

export interface CatalogActivitiesQuery {
  ageBand?: AgeBand;
  type?: ActivityType;
  domain?: Domain;
  language?: "en" | "fil" | "hil";
  setting?: Setting;
  limit?: number;
}

export interface CatalogActivitiesResponse {
  total: number;
  items: CatalogActivity[];
}

/** Parent-friendly labels (UI/UX Spec §2.6) */
export const DOMAIN_LABELS: Record<Domain, string> = {
  cognitive: "Thinking",
  motor: "Moving",
  language: "Talking",
  socioEmotional: "Feelings",
};

export const SETTING_LABELS: Record<Setting, string> = {
  indoor: "Indoor",
  outdoor: "Outdoor",
  either: "Indoor or outdoor",
};
