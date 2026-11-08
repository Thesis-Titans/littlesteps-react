export interface JournalEntry {
  id: string;
  childId: string;
  entryDate: string; // YYYY-MM-DD
  content: string;
  linkedMilestoneId?: string;
  linkedActivityId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJournalEntryInput {
  content: string;
  entryDate?: string;
  linkedMilestoneId?: string;
  linkedActivityId?: string;
}

export interface UpdateJournalEntryInput {
  content?: string;
  entryDate?: string;
  linkedMilestoneId?: string | null;
  linkedActivityId?: string | null;
}

export interface JournalFilter {
  date?: string;
}

