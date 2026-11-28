import { useState } from "react";
import { Button, Icon } from "../../../components/common";

export interface StorybookCardData {
  id: string;
  title: string;
  authors: string[];
  coverUrl?: string | null;
  subjects?: string[];
}

export interface StorybookCardProps {
  book: StorybookCardData;
  /** Prefix for heading id so shelf and search grids never collide in the DOM. */
  idPrefix: "book" | "shelf-book";
  /** Whether the book is currently saved on the family bookshelf. */
  isSaved: boolean;
  /** Whether the bookmark button should be rendered (requires an active child). */
  canSave: boolean;
  /** Custom label and tooltip for the save/remove button. */
  saveButtonVariant?: "shelf" | "catalog";
  onOpenPlayIdea: () => void;
  onToggleSave?: () => void;
}

/**
 * Declarative book cover thumbnail with graceful icon fallback when the image is missing or fails to load.
 */
function BookCover({ title, coverUrl }: { title: string; coverUrl?: string | null }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = Boolean(coverUrl && failedUrl !== coverUrl);

  return (
    <div className="storybook-cover-wrapper">
      {showImage ? (
        <img
          src={coverUrl!}
          alt={`${title} cover`}
          className="storybook-cover-img"
          loading="lazy"
          onError={() => setFailedUrl(coverUrl ?? null)}
        />
      ) : (
        <div className="storybook-cover-placeholder" aria-hidden="true">
          <Icon name="book" size={32} />
        </div>
      )}
    </div>
  );
}

/**
 * Reusable storybook card shared between Open Library results and the Family Bookshelf.
 */
export function StorybookCard({
  book,
  idPrefix,
  isSaved,
  canSave,
  saveButtonVariant = "catalog",
  onOpenPlayIdea,
  onToggleSave,
}: StorybookCardProps) {
  const headingId = `${idPrefix}-${book.id}`;
  const isShelfMode = saveButtonVariant === "shelf";

  return (
    <article className="storybook-card" aria-labelledby={headingId}>
      <BookCover title={book.title} coverUrl={book.coverUrl} />

      <div className="storybook-content">
        <h3 id={headingId} className="storybook-title">
          {book.title}
        </h3>
        {book.authors.length > 0 && (
          <p className="storybook-author">by {book.authors.join(", ")}</p>
        )}

        {book.subjects && book.subjects.length > 0 && (
          <div className="storybook-subjects-tags">
            {book.subjects.slice(0, 3).map((subject, index) => (
              <span key={`${subject}-${index}`} className="storybook-subject-tag">
                {subject}
              </span>
            ))}
          </div>
        )}

        <div className="storybook-actions">
          <Button
            variant="secondary"
            className="storybook-play-btn"
            onClick={onOpenPlayIdea}
            aria-label={`Get a play idea for ${book.title}`}
          >
            Get a play idea
          </Button>
          {canSave && onToggleSave && (
            <Button
              variant={!isShelfMode && isSaved ? "secondary" : "text"}
              className={`storybook-bookmark-btn ${isSaved ? "is-saved" : ""}`}
              onClick={onToggleSave}
              aria-label={
                isShelfMode
                  ? `Remove ${book.title} from bookshelf`
                  : isSaved
                    ? `Remove ${book.title} from your shelf`
                    : `Save ${book.title} to your shelf`
              }
              aria-pressed={isShelfMode ? undefined : isSaved}
              title={
                isShelfMode
                  ? "Remove from bookshelf"
                  : isSaved
                    ? "On your shelf"
                    : "Save to shelf"
              }
            >
              <Icon name={isSaved ? "bookmark-check" : "bookmark"} size={18} />
              <span>{isSaved ? "Saved" : "Save"}</span>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
