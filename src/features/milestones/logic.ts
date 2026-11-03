import { DOMAINS, type Domain } from "../catalog/types";
import type { MilestoneObservation, MilestonePrompt } from "./types";

/** Newest record per prompt. */
export function latestByPrompt(observations: MilestoneObservation[]): Map<string, MilestoneObservation> {
  const map = new Map<string, MilestoneObservation>();
  for (const o of observations) {
    const current = map.get(o.milestoneId);
    if (!current || o.updatedAt > current.updatedAt) map.set(o.milestoneId, o);
  }
  return map;
}

export function groupByDomain(prompts: MilestonePrompt[]): { domain: Domain; prompts: MilestonePrompt[] }[] {
  return DOMAINS.map((domain) => ({ domain, prompts: prompts.filter((p) => p.domain === domain) })).filter((g) => g.prompts.length > 0);
}

/** The only two lines a prompt may show. `not_sure` reads as not observed. */
export function observedText(observation: MilestoneObservation | undefined): string {
  if (observation?.status !== "observed") return "Not seen yet";
  const [y, m, d] = observation.observedDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  return `Seen on ${date}`;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** The API rejects dates after today in UTC (api #43), so the latest date offered is the earlier of the local and UTC dates. */
export function todayIso(now = new Date()): string {
  const local = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const utc = now.toISOString().slice(0, 10);
  return local < utc ? local : utc;
}

export const FUTURE_DATE_MESSAGE = "We can't save a date that's still ahead of today's date. Pick yesterday.";

/** First 120 characters of a note, cut at a word. */
export function noteExcerpt(notes: string | undefined, max = 120): string {
  const text = (notes ?? "").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

export function dateProblem(date: string): string | undefined {
  if (!date) return "Choose the date you saw it.";
  if (date > todayIso()) return FUTURE_DATE_MESSAGE;
  return undefined;
}
