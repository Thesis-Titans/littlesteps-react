import { apiFetch } from "../../services/api";
import type { WeeklySummary, WeeklySummaryQuery } from "./types";

const summaryPath = (childId: string) =>
  `/api/v1/children/${encodeURIComponent(childId)}/summary/weekly`;

export async function getWeeklySummary(
  childId: string,
  query?: WeeklySummaryQuery
): Promise<WeeklySummary> {
  const params = new URLSearchParams();
  if (query?.startDate) params.set("startDate", query.startDate);
  const qs = params.toString();
  const response = await apiFetch(`${summaryPath(childId)}${qs ? `?${qs}` : ""}`);
  return (await response.json()) as WeeklySummary;
}

