import { Badge, Button } from "../../../components/common";
import { formatDate } from "../../today/logic";
import type { JournalEntry } from "../types";

export interface JournalEntryCardProps {
  entry: JournalEntry;
  onDelete: (entry: JournalEntry) => void;
}

/**
 * Displays a single private caregiver journal note with date heading and delete trigger.
 */
export function JournalEntryCard({ entry, onDelete }: JournalEntryCardProps) {
  const formattedDate = formatDate(entry.entryDate);

  return (
    <article className="journal-card" aria-labelledby={`note-${entry.id}-date`}>
      <div className="journal-card-header">
        <h3 id={`note-${entry.id}-date`} className="journal-card-date">
          {formattedDate}
        </h3>
        <Badge kind="private" />
      </div>

      <p className="journal-card-content">{entry.content}</p>

      <div className="journal-card-footer">
        <Button
          variant="secondary"
          className="journal-delete-btn"
          onClick={() => onDelete(entry)}
          aria-label={`Delete note from ${formattedDate}`}
        >
          Delete note
        </Button>
      </div>
    </article>
  );
}
