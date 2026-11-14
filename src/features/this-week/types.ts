export interface DomainDistribution {
  cognitive: number;
  motor: number;
  language: number;
  socioEmotional: number;
}

export interface WeeklySummary {
  id: string; // ISO week identifier, e.g. "2026-W45"
  weekStartDate: string; // YYYY-MM-DD
  weekEndDate: string; // YYYY-MM-DD
  completedActivityCount: number;
  observedMilestoneCount: number;
  totalPlannedActivities: number;
  domainDistribution: DomainDistribution;
  topActivityIds: string[];
  reflectionPrompt: string;
  generatedAt: string;
}

export interface WeeklySummaryQuery {
  week?: string;
  startDate?: string;
}

