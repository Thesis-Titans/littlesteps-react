import { ApiError } from "../../services/api";
import { failureKind } from "../../services/offline";
import type { CatalogActivity } from "../catalog";
import type { Plan, QuickFilter } from "./types";

/** Today in the caregiver's own time zone, as YYYY-MM-DD (the format the API expects). */
export function localDate(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Same rule as the API: YYYY-MM-DD and a real calendar date. Returns an error message, or undefined when valid. */
export function validatePlanDate(value: string): string | undefined {
  if (!value) return "Choose a date.";
  const match = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.exec(value);
  if (!match) return "Enter a date like 2026-11-05.";
  const [year, month, day] = match.slice(1).map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCMonth() === month - 1 && d.getUTCDate() === day ? undefined : "Enter a real date.";
}

export const QUICK_FILTERS: { id: QuickFilter; label: string }[] = [
  { id: "under10", label: "Under 10 mins" },
  { id: "noMaterials", label: "No materials needed" },
  { id: "indoor", label: "Indoor" }
];

/** Filters combine (all selected must match). Activities we can't find stay hidden while a filter is on. */
export function matchesFilters(activity: CatalogActivity | undefined, filters: QuickFilter[]): boolean {
  if (filters.length === 0) return true;
  if (!activity) return false;
  return filters.every((f) =>
    f === "under10" ? activity.durationMinutes <= 10 // spec J2: "most take 10 minutes or less"; label wording tracked in docs #92
      : f === "noMaterials" ? activity.materials.length === 0
      : activity.setting !== "outdoor"
  );
}

/** Most recently completed first. */
export const byCompletedDesc = (a: Plan, b: Plan) => (b.completedAt ?? "").localeCompare(a.completedAt ?? "");

/** The day a plan was completed, in the caregiver's local time; falls back to the planned date. */
export function formatCompleted(plan: Plan): string {
  const done = plan.completedAt ? new Date(plan.completedAt) : undefined;
  return done && !Number.isNaN(done.getTime())
    ? done.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })
    : formatDate(plan.scheduledDate);
}

/** "2026-11-05" as "Nov 5, 2026" without time-zone drift. */
export function formatDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
}

export type Problem = { kind: "offline" | "error" | "unauthorized" | "gone"; message: string };

/** Wording follows UI/UX spec §7 (J2). `what` is the failed action, e.g. "marked complete". */
export function problemFor(error: unknown, what: string): Problem {
  if (error instanceof ApiError && error.status === 404) {
    return { kind: "gone", message: "This activity isn't available anymore. It was taken off our list. The rest of your plan is still here." };
  }
  const kind = failureKind(error, typeof navigator === "undefined" || navigator.onLine !== false);
  if (kind === "offline") return { kind, message: `You're offline. This activity wasn't ${what}.` };
  if (kind === "unauthorized") return { kind, message: `Your session has ended. Please sign in again. This activity wasn't ${what}.` };
  return { kind, message: `We couldn't reach LittleSteps. This activity wasn't ${what}.` };
}
