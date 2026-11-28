import { useState, type FormEvent } from "react";
import { Badge, Button, InlineAlert } from "../../../components/common";
import { localDate } from "../../today/logic";

const MAX_CHAR_COUNT = 2000;
const NEAR_LIMIT_COUNT = 1800;

export interface JournalComposerProps {
  childNickname: string;
  onSave: (entry: { content: string; entryDate: string }) => Promise<void>;
}

/**
 * Private observation journal entry form with character limit feedback and offline retry.
 */
export function JournalComposer({ childNickname, onSave }: JournalComposerProps) {
  const [content, setContent] = useState("");
  const [entryDate, setEntryDate] = useState(localDate);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitOffline, setSubmitOffline] = useState(false);

  const charCount = content.length;
  const isOverLimit = charCount > MAX_CHAR_COUNT;
  const isNearLimit = charCount >= NEAR_LIMIT_COUNT && !isOverLimit;

  async function saveEntry() {
    const trimmed = content.trim();
    if (!trimmed) return;

    if (trimmed.length > MAX_CHAR_COUNT) {
      setSubmitOffline(false);
      setSubmitError("Notes can be up to 2,000 characters. Please make this one a little shorter.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitOffline(false);

    try {
      await onSave({
        content: trimmed,
        entryDate: entryDate || localDate(),
      });
      setContent("");
    } catch {
      const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
      setSubmitOffline(isOffline);
      setSubmitError(
        isOffline
          ? "You're offline. Your note wasn't saved."
          : "Could not save your note right now. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void saveEntry();
  }

  return (
    <section className="journal-form-card" aria-labelledby="new-note-heading">
      <h2 id="new-note-heading" className="journal-form-title">
        New note
      </h2>

      {submitError && (
        <InlineAlert
          kind={submitOffline ? "offline" : "caution"}
          title="Note not saved"
          action={
            submitOffline ? (
              <Button variant="secondary" onClick={() => void saveEntry()} disabled={isSubmitting}>
                Retry
              </Button>
            ) : undefined
          }
        >
          <p>{submitError}</p>
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
            What did you see?
          </label>
          <textarea
            id="journal-content"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (submitError) {
                setSubmitError(null);
                setSubmitOffline(false);
              }
            }}
            placeholder={`A moment, something new, or a favorite memory of ${childNickname}…`}
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
            >
              {charCount} / {MAX_CHAR_COUNT}
            </span>
            {/* Announces limit transitions without reading every keystroke aloud. */}
            <span className="ls-visually-hidden" role="status">
              {isOverLimit
                ? "Over the 2,000-character limit."
                : isNearLimit
                  ? "Close to the 2,000-character limit."
                  : ""}
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
  );
}
