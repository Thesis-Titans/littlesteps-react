import { useState, type FormEvent } from "react";
import { Badge, Button, InlineAlert } from "../../../components/common";
import { formatDate, localDate } from "../../today/logic";
import type { JournalEntry } from "../types";

const MAX_CHAR_COUNT = 2000;

export interface JournalEntryCardProps {
  entry: JournalEntry;
  onUpdate: (entryId: string, input: { content: string; entryDate: string }) => Promise<void>;
  onDelete: (entry: JournalEntry) => void;
}

/**
 * Displays a single private caregiver journal note with inline editing and delete trigger.
 */
export function JournalEntryCard({ entry, onUpdate, onDelete }: JournalEntryCardProps) {
  const formattedDate = formatDate(entry.entryDate);
  const [editing, setEditing] = useState(false);
  const [draftContent, setDraftContent] = useState(entry.content);
  const [draftDate, setDraftDate] = useState(entry.entryDate);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isOverLimit = draftContent.length > MAX_CHAR_COUNT;

  function openEdit() {
    setDraftContent(entry.content);
    setDraftDate(entry.entryDate);
    setSaveError(null);
    setEditing(true);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    const trimmed = draftContent.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_CHAR_COUNT) {
      setSaveError("Notes can be up to 2,000 characters. Please make this one shorter.");
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      await onUpdate(entry.id, { content: trimmed, entryDate: draftDate || entry.entryDate });
      setEditing(false);
    } catch {
      const offline = typeof navigator !== "undefined" && !navigator.onLine;
      setSaveError(
        offline
          ? "You're offline. Your edits weren't saved."
          : "Could not update this note right now. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="journal-card" aria-labelledby={`note-${entry.id}-date`}>
      <div className="journal-card-header">
        <h3 id={`note-${entry.id}-date`} className="journal-card-date">
          {formattedDate}
        </h3>
        <Badge kind="private" />
      </div>

      {editing ? (
        <form onSubmit={(e) => void handleSave(e)} className="journal-edit-form">
          {saveError && (
            <InlineAlert kind="caution" title="Changes not saved">
              <p>{saveError}</p>
            </InlineAlert>
          )}
          <div className="journal-form-field">
            <label htmlFor={`edit-date-${entry.id}`} className="journal-form-label">
              Date
            </label>
            <input
              id={`edit-date-${entry.id}`}
              type="date"
              value={draftDate}
              max={localDate()}
              onChange={(e) => setDraftDate(e.target.value)}
              className="journal-input"
              required
            />
          </div>
          <div className="journal-textarea-wrapper">
            <label htmlFor={`edit-content-${entry.id}`} className="journal-form-label">
              Edit note
            </label>
            <textarea
              id={`edit-content-${entry.id}`}
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
              rows={4}
              className="journal-textarea"
              aria-invalid={isOverLimit}
              required
            />
            <span className={`journal-char-counter ${isOverLimit ? "is-error" : ""}`}>
              {draftContent.length} / {MAX_CHAR_COUNT}
            </span>
          </div>
          <div className="journal-card-actions">
            <Button
              type="submit"
              variant="primary"
              busy={saving}
              disabled={!draftContent.trim() || isOverLimit}
            >
              {saving ? "Saving…" : "Save changes"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={saving}
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <>
          <p className="journal-card-content">{entry.content}</p>
          <div className="journal-card-footer">
            <div className="journal-card-actions">
              <Button
                variant="secondary"
                onClick={openEdit}
                aria-label={`Edit note from ${formattedDate}`}
              >
                Edit note
              </Button>
              <Button
                variant="secondary"
                className="journal-delete-btn"
                onClick={() => onDelete(entry)}
                aria-label={`Delete note from ${formattedDate}`}
              >
                Delete note
              </Button>
            </div>
          </div>
        </>
      )}
    </article>
  );
}
