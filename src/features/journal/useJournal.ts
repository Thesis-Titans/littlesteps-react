import { useCallback, useEffect, useState } from "react";
import { failureKind } from "../../services/offline";
import { createJournalEntry, deleteJournalEntry, listJournalEntries, updateJournalEntry } from "./api";
import type { CreateJournalEntryInput, JournalEntry, JournalFilter, UpdateJournalEntryInput } from "./types";

export interface JournalState {
  status: "loading" | "ready" | "error" | "offline" | "unauthorized";
  entries: JournalEntry[];
  reload: () => void;
  addEntry: (input: CreateJournalEntryInput) => Promise<JournalEntry>;
  editEntry: (entryId: string, input: UpdateJournalEntryInput) => Promise<JournalEntry>;
  removeEntry: (entryId: string) => Promise<void>;
}

export function useJournal(childId: string, filter?: JournalFilter): JournalState {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [status, setStatus] = useState<JournalState["status"]>("loading");
  const [attempt, setAttempt] = useState(0);

  const filterDate = filter?.date;

  useEffect(() => {
    let current = true;
    listJournalEntries(childId, filterDate ? { date: filterDate } : undefined).then(
      (list) => {
        if (!current) return;
        setEntries(list);
        setStatus("ready");
      },
      (error: unknown) => {
        if (current) setStatus(failureKind(error, navigator.onLine));
      }
    );
    return () => {
      current = false;
    };
  }, [childId, filterDate, attempt]);

  const reload = useCallback(() => {
    setStatus("loading");
    setAttempt((n) => n + 1);
  }, []);

  const addEntry = useCallback(
    async (input: CreateJournalEntryInput) => {
      const created = await createJournalEntry(childId, input);
      setEntries((prev) => [created, ...prev.filter((e) => e.id !== created.id)]);
      return created;
    },
    [childId]
  );

  const editEntry = useCallback(
    async (entryId: string, input: UpdateJournalEntryInput) => {
      const updated = await updateJournalEntry(childId, entryId, input);
      setEntries((prev) => prev.map((e) => (e.id === entryId ? updated : e)));
      return updated;
    },
    [childId]
  );

  const removeEntry = useCallback(
    async (entryId: string) => {
      await deleteJournalEntry(childId, entryId);
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
    },
    [childId]
  );

  return { status, entries, reload, addEntry, editEntry, removeEntry };
}
