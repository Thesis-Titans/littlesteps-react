import { Button, Card, EmptyState, InlineAlert, Skeleton } from "../../../components/common";
import type { BookItem, SavedBook } from "../../catalog/types";
import { StorybookCard } from "./StorybookCard";

export interface BookshelfTabProps {
  childNickname?: string;
  savedBooks: SavedBook[];
  savedStatus: "idle" | "loading" | "ready" | "error";
  savedActionError: string | null;
  onBrowseBooks: () => void;
  onOpenPlayIdea: (book: BookItem) => void;
  onRemoveBook: (book: SavedBook) => void;
}

/**
 * Saved Family Bookshelf tab showing physical picture books the caregiver saved at home.
 */
export function BookshelfTab({
  childNickname,
  savedBooks,
  savedStatus,
  savedActionError,
  onBrowseBooks,
  onOpenPlayIdea,
  onRemoveBook,
}: BookshelfTabProps) {
  return (
    <div className="bookshelf-shelf">
      <div className="bookshelf-intro">
        <h3>{childNickname ? `${childNickname}'s Bookshelf` : "Our Bookshelf"}</h3>
        <p>
          Physical storybooks you have at home. Tap &ldquo;Get a play idea&rdquo; for an instant story companion activity.
        </p>
      </div>

      {savedActionError && (
        <InlineAlert kind="caution" title="Bookshelf update">
          <p>{savedActionError}</p>
        </InlineAlert>
      )}

      {savedStatus === "error" && (
        <InlineAlert kind="caution" title="Connection error">
          <p>Could not load your saved storybooks right now. Please try again later.</p>
        </InlineAlert>
      )}

      {savedStatus === "loading" && (
        <div className="storybooks-grid" aria-busy="true" aria-label="Loading bookshelf">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Card key={idx} as="div" className="storybook-card">
              <Skeleton kind="card" label="Loading saved storybooks…" />
            </Card>
          ))}
        </div>
      )}

      {savedStatus !== "loading" && savedBooks.length === 0 && (
        <EmptyState
          title="Your bookshelf is empty"
          action={
            <Button variant="secondary" onClick={onBrowseBooks}>
              Search storybooks
            </Button>
          }
        >
          Search for storybooks you have at home to save them here and get instant play ideas anytime.
        </EmptyState>
      )}

      {savedStatus !== "loading" && savedBooks.length > 0 && (
        <div className="storybooks-grid">
          {savedBooks.map((book) => (
            <StorybookCard
              key={book.id}
              book={book}
              idPrefix="shelf-book"
              isSaved
              canSave
              saveButtonVariant="shelf"
              onOpenPlayIdea={() =>
                onOpenPlayIdea({
                  id: book.id,
                  title: book.title,
                  authors: book.authors,
                  coverUrl: book.coverUrl ?? null,
                  subjects: book.subjects,
                  source: "Our Bookshelf",
                })
              }
              onToggleSave={() => onRemoveBook(book)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
