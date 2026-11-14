import { apiFetch } from "../../services/api";
import { FALLBACK_CATALOG_ACTIVITIES, FALLBACK_BOOKS } from "./fallbackData";
import type {
  BookSubject,
  BooksResponse,
  CatalogActivitiesQuery,
  CatalogActivitiesResponse,
  CatalogActivity,
} from "./types";

export async function fetchBooks(
  subject: BookSubject = "picture_books",
  limit = 12
): Promise<BooksResponse> {
  const params = new URLSearchParams({ subject, limit: String(limit) });
  const response = await apiFetch(`/api/v1/catalog/books?${params.toString()}`);
  return (await response.json()) as BooksResponse;
}

export function filterFallbackBooks(subject: BookSubject = "picture_books"): BooksResponse {
  const matching = FALLBACK_BOOKS.filter(
    (b) => b.subjects.some((s) => s.toLowerCase().includes(subject.replace("_", " ")))
  );
  const books = matching.length > 0 ? matching : FALLBACK_BOOKS;
  return {
    subject,
    totalCount: books.length,
    books,
    provenance: {
      source: "Open Library (Offline Fallback)",
      license: "Open Library data (CC BY 4.0 / Public Domain)",
    },
  };
}

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
