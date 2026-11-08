import { apiFetch } from "../../services/api";
import type {
  CreateJournalEntryInput,
  JournalEntry,
  JournalFilter,
  UpdateJournalEntryInput
} from "./types";

const journalPath = (childId: string) => `/api/v1/children/${encodeURIComponent(childId)}/journal`;

const jsonHeaders = { "Content-Type": "application/json" };

export async function listJournalEntries(childId: string, filter?: JournalFilter): Promise<JournalEntry[]> {
  const params = new URLSearchParams();
  if (filter?.date) params.set("date", filter.date);
  const qs = params.toString();
  const response = await apiFetch(`${journalPath(childId)}${qs ? `?${qs}` : ""}`);
  return (await response.json()) as JournalEntry[];
}

export async function getJournalEntry(childId: string, entryId: string): Promise<JournalEntry> {
  const response = await apiFetch(`${journalPath(childId)}/${encodeURIComponent(entryId)}`);
  return (await response.json()) as JournalEntry;
}

export async function createJournalEntry(childId: string, input: CreateJournalEntryInput): Promise<JournalEntry> {
  const response = await apiFetch(journalPath(childId), {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(input)
  });
  return (await response.json()) as JournalEntry;
}

export async function updateJournalEntry(
  childId: string,
  entryId: string,
  input: UpdateJournalEntryInput
): Promise<JournalEntry> {
  const response = await apiFetch(`${journalPath(childId)}/${encodeURIComponent(entryId)}`, {
    method: "PATCH",
    headers: jsonHeaders,
    body: JSON.stringify(input)
  });
  return (await response.json()) as JournalEntry;
}

export async function deleteJournalEntry(childId: string, entryId: string): Promise<void> {
  await apiFetch(`${journalPath(childId)}/${encodeURIComponent(entryId)}`, {
    method: "DELETE"
  });
}

