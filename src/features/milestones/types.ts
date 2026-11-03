import type { AgeBand, Domain } from "../catalog/types";

export const MILESTONE_STATUSES = ["observed", "not_yet_observed", "not_sure"] as const;
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

/** Parent wording for the status values (UI/UX spec §2.6). The API keeps the technical names. */
export const STATUS_LABELS: Record<MilestoneStatus, string> = {
  observed: "I saw it",
  not_yet_observed: "Not seen yet",
  not_sure: "Not sure",
};

export const NOTE_MAX_LENGTH = 500;

/** Shape of data-model §2.8 `catalog_milestones`; there is no API route for prompts yet. */
export type MilestonePrompt = {
  id: string;
  domain: Domain;
  ageBand: AgeBand;
  title: string;
  indicators: string[];
  provenanceSource: string;
  /** `synthetic_fixture` until docs #3 supplies reviewed content. */
  reviewStatus: "reviewed_approved" | "synthetic_fixture";
};

export type MilestoneObservation = {
  id: string;
  childId: string;
  milestoneId: string;
  status: MilestoneStatus;
  /** "YYYY-MM-DD" */
  observedDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type ObservationInput = { status: MilestoneStatus; observedDate: string; notes?: string };
