import { useState } from "react";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  Icon,
  InlineAlert,
  Skeleton,
  SuccessNotice,
} from "../../components/common";
import { ScreenHeader, TwoColumnLayout } from "../../components/layout";
import { useChild } from "../children/useChild";
import { JournalComposer } from "./components/JournalComposer";
import { JournalEntryCard } from "./components/JournalEntryCard";
import type { JournalEntry } from "./types";
import { useJournal } from "./useJournal";

/** Private observation journal screen scoped to the active child profile. */
export function JournalScreen() {
  const { activeChild } = useChild();

  if (!activeChild) {
    return (
      <section className="screen" aria-labelledby="journal-title">
        <ScreenHeader
          id="journal-title"
          title="Journal"
          subtitle="Everyday moments and notes you choose to remember."
        />
        <EmptyState title="No child profile selected">
          <p>Choose or add a child to read and write notes.</p>
        </EmptyState>
      </section>
    );
  }

  return (
    <ActiveChildJournal
      key={activeChild.id}
      childId={activeChild.id}
      childNickname={activeChild.nickname}
    />
  );
}

function ActiveChildJournal({ childId, childNickname }: { childId: string; childNickname: string }) {
  const [filterDate, setFilterDate] = useState("");
  const { status, entries, reload, addEntry, editEntry, removeEntry } = useJournal(
    childId,
    filterDate ? { date: filterDate } : undefined
  );

  const [notice, setNotice] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<JournalEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSaveEntry(input: { content: string; entryDate: string }) {
    setDeleteError(null);
    await addEntry(input);
    setNotice("Note saved to journal.");
  }

  async function handleUpdateEntry(
    entryId: string,
    input: { content: string; entryDate: string }
  ) {
    setDeleteError(null);
    await editEntry(entryId, input);
    setNotice("Note updated.");
  }

  async function handleDeleteConfirm() {
    if (!deletingEntry) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await removeEntry(deletingEntry.id);
      setNotice("Note deleted.");
      setDeletingEntry(null);
    } catch {
      setDeleteError("Could not delete this note. Please check your connection.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="screen journal-screen" aria-labelledby="journal-title">
      <ScreenHeader
        id="journal-title"
        title="Journal"
        subtitle={`Everyday moments and notes about ${childNickname}.`}
      />

      <SuccessNotice message={notice ?? undefined} onClose={() => setNotice(null)} />

      <TwoColumnLayout
        asidePosition="left"
        asideLabel="Write a private journal note"
        aside={
          <>
            <aside className="journal-privacy-callout" role="note" aria-label="Privacy notice">
              <Icon name="lock" size={16} />
              <span>Only you can see your notes. They are never shared or sent to AI.</span>
            </aside>

            <JournalComposer childNickname={childNickname} onSave={handleSaveEntry} />
          </>
        }
        main={
          <>
            {deleteError && (
              <InlineAlert kind="caution" title="Note not deleted">
                <p>{deleteError}</p>
              </InlineAlert>
            )}

            <div className="journal-filter-bar" role="search" aria-label="Filter journal notes">
              <div className="journal-filter-left">
                <label htmlFor="filter-journal-date" className="journal-form-label">
                  Filter by date:
                </label>
                <input
                  id="filter-journal-date"
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="journal-input"
                  aria-label="Filter notes by date"
                />
              </div>
              {filterDate && (
                <Button variant="secondary" onClick={() => setFilterDate("")}>
                  Clear date filter
                </Button>
              )}
            </div>

            {status === "unauthorized" && (
              <InlineAlert kind="caution" title="Access denied">
                <p>We can&apos;t open this note. It may have been deleted. Your own notes are safe.</p>
              </InlineAlert>
            )}

            {status === "error" && (
              <InlineAlert
                kind="caution"
                title="Connection error"
                action={
                  <Button variant="secondary" onClick={reload}>
                    Retry
                  </Button>
                }
              >
                <p>We couldn&apos;t reach LittleSteps. Please check your connection and try again.</p>
              </InlineAlert>
            )}

            {status === "offline" && (
              <InlineAlert kind="offline" title="Offline mode">
                <p>You&apos;re offline. Previously loaded notes are shown.</p>
              </InlineAlert>
            )}

            {status === "loading" && (
              <div className="journal-feed" aria-busy="true" aria-label="Loading journal notes">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="journal-card">
                    <Skeleton kind="card" label="Loading journal note…" />
                  </div>
                ))}
              </div>
            )}

            {status === "ready" && entries.length === 0 && (
              <EmptyState
                title={`No notes for ${childNickname} yet`}
                action={
                  <Button
                    variant="secondary"
                    onClick={() => {
                      document.getElementById("journal-content")?.focus();
                    }}
                  >
                    Write a note
                  </Button>
                }
              >
                <p>Jot down small wins, funny moments, or things {childNickname} is trying.</p>
              </EmptyState>
            )}

            {(status === "ready" || status === "offline") && entries.length > 0 && (
              <div className="journal-feed" role="feed" aria-label="Journal notes">
                {entries.map((entry) => (
                  <JournalEntryCard
                    key={entry.id}
                    entry={entry}
                    onUpdate={handleUpdateEntry}
                    onDelete={setDeletingEntry}
                  />
                ))}
              </div>
            )}
          </>
        }
      />

      <ConfirmDialog
        open={deletingEntry !== null}
        title="Delete this note?"
        confirmLabel={isDeleting ? "Deleting..." : "Delete note"}
        destructive
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => setDeletingEntry(null)}
      >
        <p>This note will be deleted for good. This cannot be undone.</p>
      </ConfirmDialog>
    </section>
  );
}
