import type { FormEvent } from "react";
import { Button, Card, Chip, EmptyState, InlineAlert, Skeleton } from "../../../components/common";
import { EXTERNAL_LINKS } from "../../../config/externalLinks";
import {
  BOOK_SUBJECTS,
  BOOK_SUBJECT_LABELS,
  type BookItem,
  type BookSubject,
} from "../../catalog/types";
import { StorybookCard } from "./StorybookCard";

export interface OpenLibraryTabProps {
  books: BookItem[];
  status: "loading" | "ready" | "empty" | "error" | "offline";
  errorMessage: string | null;
  savedActionError: string | null;
  searchQuery: string;
  activeSearch: string | null;
  selectedSubject: BookSubject;
  canSave: boolean;
  isBookSaved: (bookId: string) => boolean;
  onSearchQueryChange: (value: string) => void;
  onSearchSubmit: (event: FormEvent) => void;
  onClearSearch: () => void;
  onSelectSubject: (subject: BookSubject) => void;
  onShowAnimalStories: () => void;
  onOpenPlayIdea: (book: BookItem) => void;
  onToggleSave: (book: BookItem) => void;
}

/**
 * Open Library browse and search tab with topic filter chips and saved bookshelf actions.
 */
export function OpenLibraryTab({
  books,
  status,
  errorMessage,
  savedActionError,
  searchQuery,
  activeSearch,
  selectedSubject,
  canSave,
  isBookSaved,
  onSearchQueryChange,
  onSearchSubmit,
  onClearSearch,
  onSelectSubject,
  onShowAnimalStories,
  onOpenPlayIdea,
  onToggleSave,
}: OpenLibraryTabProps) {
  return (
    <>
      <div className="storybooks-search">
        <form onSubmit={onSearchSubmit} className="storybooks-search-form">
          <input
            type="search"
            className="ls-control storybooks-search-input"
            placeholder="Search books you have at home..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            aria-label="Search storybooks by title or author"
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
          {activeSearch && (
            <Button type="button" variant="text" onClick={onClearSearch}>
              Clear
            </Button>
          )}
        </form>

        {!activeSearch && (
          <div className="storybooks-subjects" role="group" aria-label="Book subjects">
            {BOOK_SUBJECTS.map((subject) => {
              const isSelected = selectedSubject === subject;
              return (
                <Chip
                  key={subject}
                  selected={isSelected}
                  onClick={() => onSelectSubject(subject)}
                  aria-pressed={isSelected}
                >
                  {BOOK_SUBJECT_LABELS[subject]}
                </Chip>
              );
            })}
          </div>
        )}
      </div>

      {savedActionError && (
        <InlineAlert kind="caution" title="Bookshelf update">
          <p>{savedActionError}</p>
        </InlineAlert>
      )}

      {status === "offline" && (
        <InlineAlert kind="offline" title="Offline mode">
          <p>You are viewing cached and offline fallback storybooks.</p>
        </InlineAlert>
      )}

      {status === "error" && errorMessage && (
        <InlineAlert kind="caution" title="Connection error">
          <p>{errorMessage}</p>
        </InlineAlert>
      )}

      {status === "loading" && (
        <div className="storybooks-grid" aria-busy="true" aria-label="Loading storybooks">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Card key={idx} as="div" className="storybook-card">
              <Skeleton kind="card" label="Loading storybooks…" />
            </Card>
          ))}
        </div>
      )}

      {status === "empty" && (
        <EmptyState
          title="No books found for this topic. Try another topic, like animals or bedtime."
          action={
            <Button variant="secondary" onClick={onShowAnimalStories}>
              View animal stories
            </Button>
          }
        />
      )}

      {(status === "ready" || status === "offline") && books.length > 0 && (
        <div className="storybooks-grid">
          {books.map((book) => (
            <StorybookCard
              key={book.id}
              book={book}
              idPrefix="book"
              isSaved={isBookSaved(book.id)}
              canSave={canSave}
              onOpenPlayIdea={() => onOpenPlayIdea(book)}
              onToggleSave={() => onToggleSave(book)}
            />
          ))}
        </div>
      )}

      <footer className="storybooks-credit">
        <p>
          Books from{" "}
          <a
            href={EXTERNAL_LINKS.openLibrary}
            target="_blank"
            rel="noopener noreferrer"
            className="storybooks-credit-link"
          >
            Open Library
          </a>
          . Everyday play companion suggestions only.
        </p>
      </footer>
    </>
  );
}
