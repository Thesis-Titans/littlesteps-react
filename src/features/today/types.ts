export type PlanStatus = "planned" | "completed" | "skipped";

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
  createdAt: string;
  updatedAt: string;
};

export type CreatePlanInput = { activityId: string; scheduledDate: string };
export type UpdatePlanInput = { status?: PlanStatus; scheduledDate?: string };

export type QuickFilter = "under10" | "noMaterials" | "indoor";
