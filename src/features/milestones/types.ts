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

/** Observational milestone prompt loaded from the catalog or local reference list. */
export type MilestonePrompt = {
  id: string;
  domain: Domain;
  ageBand: AgeBand;
  title: string;
  indicators: string[];
  provenanceSource: string;
  reviewStatus: "reviewed_approved" | "source_checked" | "synthetic_fixture";
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
