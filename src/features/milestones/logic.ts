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
  if (observation?.status !== "observed") return "Not yet observed";
  const [y, m, d] = observation.observedDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  return `Observed on ${date}`;
}

/** The API rejects dates after today in UTC, so the form never offers a later one. */
export const todayIso = () => new Date().toISOString().slice(0, 10);

export function dateProblem(date: string): string | undefined {
  if (!date) return "Choose the date you saw it.";
  if (date > todayIso()) return "Choose today or an earlier date.";
  return undefined;
}
