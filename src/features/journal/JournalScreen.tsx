import { useState, type FormEvent } from "react";
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  InlineAlert,
  Skeleton,
  SuccessNotice,
} from "../../components/common";
import { ScreenHeader } from "../../components/layout";
import { useChild } from "../children/useChild";
import { formatDate, localDate } from "../today/logic";
import type { JournalEntry } from "./types";
import { useJournal } from "./useJournal";

const MAX_CHAR_COUNT = 2000;

export function JournalScreen() {
  const { activeChild } = useChild();

  if (!activeChild) {
    return (
      <section className="screen" aria-labelledby="journal-title">
        <ScreenHeader
          id="journal-title"
          title="Journal"
          subtitle="Record quiet moments and private milestone observations."
        />
        <EmptyState title="No child profile selected">
          <p>Please select or add a child profile to view and write journal observations.</p>
        </EmptyState>
      </section>
    );
  }

  return <ActiveChildJournal childId={activeChild.id} childNickname={activeChild.nickname} />;
}

function ActiveChildJournal({ childId, childNickname }: { childId: string; childNickname: string }) {
  const [filterDate, setFilterDate] = useState("");
  const { status, entries, reload, addEntry, removeEntry } = useJournal(
    childId,
    filterDate ? { date: filterDate } : undefined
  );

  // Form state
  const [content, setContent] = useState("");
  const [entryDate, setEntryDate] = useState(localDate());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Deletion modal state
  const [deletingEntry, setDeletingEntry] = useState<JournalEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const charCount = content.length;
  const isOverLimit = charCount > MAX_CHAR_COUNT;
  const isNearLimit = charCount >= 1800 && !isOverLimit;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    if (trimmed.length > MAX_CHAR_COUNT) {
      setSubmitError("Notes can be up to 2,000 characters. Please make this one a little shorter.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await addEntry({
        content: trimmed,
        entryDate: entryDate || localDate(),
      });
      setContent("");
      setNotice("Note saved to journal.");
    } catch (err: unknown) {
      const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
      if (isOffline) {
        setSubmitError("You're offline. Your note wasn't saved.");
      } else {
        setSubmitError("Could not save your note right now. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deletingEntry) return;
    setIsDeleting(true);
    try {
      await removeEntry(deletingEntry.id);
      setNotice("Note deleted.");
      setDeletingEntry(null);
    } catch (err) {
      setSubmitError("Could not delete this note. Please check your connection.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="screen journal-screen" aria-labelledby="journal-title">
      <ScreenHeader
        id="journal-title"
        title="Journal"
        subtitle={`Private observation notes for ${childNickname}.`}
      />

      <SuccessNotice message={notice ?? undefined} onClose={() => setNotice(null)} />

      {/* Privacy Callout Banner */}
      <aside className="journal-privacy-callout" role="note" aria-label="Privacy notice">
        <span aria-hidden="true">🔒</span>
        <span>
          <strong>Private by design.</strong> Only you can see these notes. They are never sent to external AI or shared.
        </span>
      </aside>

      {/* New Note Form */}
      <section className="journal-form-card" aria-labelledby="new-note-heading">
        <h2 id="new-note-heading" className="journal-form-title">
          New observation note
        </h2>

        {submitError && (
          <InlineAlert kind="caution" title="Note not saved">
            <p>{submitError}</p>
            {submitError.includes("offline") && (
              <Button
                variant="secondary"
                onClick={() => handleSubmit({ preventDefault: () => {} } as FormEvent)}
                disabled={isSubmitting}
                style={{ marginTop: "var(--space-8)" }}
              >
                Retry
              </Button>
            )}
          </InlineAlert>
        )}

        <form onSubmit={handleSubmit} className="journal-form">
          <div className="journal-form-row">
            <div className="journal-form-field">
              <label htmlFor="journal-date" className="journal-form-label">
                When did you see it?
              </label>
              <input
                id="journal-date"
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="journal-input"
                max={localDate()}
                required
              />
            </div>
          </div>

          <div className="journal-textarea-wrapper">
            <label htmlFor="journal-content" className="journal-form-label">
              Observation notes
            </label>
            <textarea
              id="journal-content"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (submitError) setSubmitError(null);
              }}
              placeholder={`Jot down a moment, milestone observation, or favorite memory of ${childNickname}...`}
              rows={4}
              className="journal-textarea"
              aria-invalid={isOverLimit}
              aria-describedby="journal-counter journal-privacy-hint"
              required
            />
            <div className="journal-counter-row">
              <span id="journal-privacy-hint" className="journal-privacy-hint">
                <Badge kind="private" />
                <span>Only you can see this note</span>
              </span>
              <span
                id="journal-counter"
                className={`journal-char-counter ${
                  isOverLimit ? "is-error" : isNearLimit ? "is-warning" : ""
                }`}
                aria-live="polite"
              >
                {charCount} / {MAX_CHAR_COUNT}
              </span>
            </div>
          </div>

          <div className="journal-form-actions">
            <Button
              variant="primary"
              type="submit"
              disabled={isSubmitting || !content.trim() || isOverLimit}
            >
              {isSubmitting ? "Saving..." : "Save note"}
            </Button>
            {content && (
              <Button
                variant="secondary"
                type="button"
                onClick={() => setContent("")}
                disabled={isSubmitting}
              >
                Clear
              </Button>
            )}
          </div>
        </form>
      </section>

      {/* Date Filter Bar */}
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

      {/* 5-State Status Display */}
      {status === "unauthorized" && (
        <InlineAlert kind="caution" title="Access denied">
          <p>We can't open this note. It may have been deleted. Your own notes are safe.</p>
        </InlineAlert>
      )}

      {status === "error" && (
        <InlineAlert kind="caution" title="Connection error">
          <p>We couldn't reach LittleSteps. Please check your connection and try again.</p>
          <Button variant="secondary" onClick={reload} style={{ marginTop: "var(--space-8)" }}>
            Retry
          </Button>
        </InlineAlert>
      )}

      {status === "offline" && (
        <InlineAlert kind="info" title="Offline mode">
          <p>You're offline. Previously loaded notes are shown.</p>
        </InlineAlert>
      )}

      {/* Loading Skeletons */}
      {status === "loading" && (
        <div className="journal-feed" aria-busy="true" aria-label="Loading journal notes">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="journal-card">
              <Skeleton height="24px" width="40%" />
              <Skeleton height="60px" width="100%" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {status === "ready" && entries.length === 0 && (
        <EmptyState
          title="Your journal is private to you."
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
          <p>Jot down a memory or funny moment.</p>
        </EmptyState>
      )}

      {/* Entries List */}
      {(status === "ready" || status === "offline") && entries.length > 0 && (
        <div className="journal-feed" role="feed" aria-label="Journal notes">
          {entries.map((entry) => (
            <article key={entry.id} className="journal-card" aria-labelledby={`note-${entry.id}-date`}>
              <div className="journal-card-header">
                <h3 id={`note-${entry.id}-date`} className="journal-card-date">
                  {formatDate(entry.entryDate)}
                </h3>
                <Badge kind="private" />
              </div>

              <p className="journal-card-content">{entry.content}</p>

              <div className="journal-card-footer">
                <Button
                  variant="secondary"
                  className="journal-delete-btn"
                  onClick={() => setDeletingEntry(entry)}
                  aria-label={`Delete note from ${formatDate(entry.entryDate)}`}
                >
                  Delete note
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingEntry}
        title="Delete this note?"
        confirmLabel={isDeleting ? "Deleting..." : "Delete note"}
        destructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingEntry(null)}
      >
        <p>This observation will be permanently removed. This cannot be undone.</p>
      </ConfirmDialog>
    </section>
  );
}
