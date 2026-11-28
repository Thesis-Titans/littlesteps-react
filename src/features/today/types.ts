import type { Domain, Setting } from "../catalog/types";

export type PlanStatus = "planned" | "completed" | "skipped";

/** Inline snapshot persisted on plans for custom AI ideas, adaptations, storybooks, and rhymes. */
export type CustomPlanActivity = {
  title: string;
  domain: Domain;
  durationMinutes: number;
  setting: Setting;
  materials: string[];
  instructions: string[];
  safetyNotice?: string;
  sourceLabel?: string;
};

/** A planned activity for one child (API `Plan`). */
export type Plan = {
  id: string;
  childId: string;
  activityId: string;
  /** YYYY-MM-DD */
  scheduledDate: string;
  status: PlanStatus;
  completedAt?: string;
  durationMinutes?: number;
  feedbackNote?: string;
  customActivity?: CustomPlanActivity;
  createdAt: string;
  updatedAt: string;
};

export type CreatePlanInput = {
  activityId: string;
  scheduledDate: string;
  durationMinutes?: number;
  customActivity?: CustomPlanActivity;
};
export type UpdatePlanInput = { status?: PlanStatus; scheduledDate?: string };

export type QuickFilter = "under10" | "noMaterials" | "indoor" | "outdoor";
