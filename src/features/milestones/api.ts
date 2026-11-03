import { apiFetch } from "../../services/api";
import type { MilestoneObservation, ObservationInput } from "./types";

const base = (childId: string) => `/api/v1/children/${encodeURIComponent(childId)}/milestones`;
const json = { "Content-Type": "application/json" };

export async function listObservations(childId: string): Promise<MilestoneObservation[]> {
  const response = await apiFetch(base(childId));
  return (await response.json()) as MilestoneObservation[];
}

export async function recordObservation(childId: string, milestoneId: string, input: ObservationInput): Promise<MilestoneObservation> {
  const response = await apiFetch(base(childId), { method: "POST", headers: json, body: JSON.stringify({ milestoneId, ...input }) });
  return (await response.json()) as MilestoneObservation;
}

/** `observationId` is the record's UUID, so a prompt with several records never updates the wrong one. */
export async function updateObservation(childId: string, observationId: string, input: ObservationInput): Promise<MilestoneObservation> {
  const response = await apiFetch(`${base(childId)}/${encodeURIComponent(observationId)}`, {
    method: "PATCH",
    headers: json,
    body: JSON.stringify(input),
  });
  return (await response.json()) as MilestoneObservation;
}
