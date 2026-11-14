import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  InlineAlert,
  Skeleton,
} from "../../../components/common";
import {
  BOOK_SUBJECTS,
  BOOK_SUBJECT_LABELS,
  type BookItem,
  type BookSubject,
} from "../../catalog/types";
import { fetchBooks, filterFallbackBooks } from "../../catalog/api";
import { failureKind } from "../../../services/offline";

export function StorybooksSection() {
  const [selectedSubject, setSelectedSubject] = useState<BookSubject>("picture_books");
  const [books, setBooks] = useState<BookItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error" | "offline">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeBook, setActiveBook] = useState<BookItem | null>(null);

  useEffect(() => {
    let current = true;

    fetchBooks(selectedSubject)
      .then((data) => {
        if (!current) return;
        if (data.books.length === 0) {
          setStatus("empty");
        } else {
          setBooks(data.books);
          setStatus("ready");
        }
      })
      .catch((err) => {
        if (!current) return;
        const kind = failureKind(err, navigator.onLine);
        if (kind === "offline" || !navigator.onLine) {
          const fallback = filterFallbackBooks(selectedSubject);
          setBooks(fallback.books);
          setStatus(fallback.books.length > 0 ? "offline" : "empty");
        } else {
          // Gracefully load offline fallback books on API error
          const fallback = filterFallbackBooks(selectedSubject);
          if (fallback.books.length > 0) {
            setBooks(fallback.books);
            setStatus("ready");
          } else {
            setStatus("error");
            setErrorMessage("Could not load storybooks right now. Please check your connection and try again.");
          }
        }
      });

    return () => {
      current = false;
    };
  }, [selectedSubject]);

  return (
    <section className="storybooks-section" aria-labelledby="storybooks-heading">
      <div className="storybooks-header">
        <h2 id="storybooks-heading" className="catalog-title">
          Storybooks
        </h2>
        <p className="catalog-subtitle">
          Recommended picture books and stories from Open Library.
        </p>
      </div>

      {/* Subject filter chips */}
      <div className="storybooks-subjects" role="group" aria-label="Book subjects">
        {BOOK_SUBJECTS.map((subject) => {
          const isSelected = selectedSubject === subject;
          return (
            <Chip
              key={subject}
              selected={isSelected}
              onClick={() => setSelectedSubject(subject)}
              aria-pressed={isSelected}
            >
              {BOOK_SUBJECT_LABELS[subject]}
            </Chip>
          );
        })}
      </div>

      {status === "offline" && (
        <InlineAlert kind="info" title="Offline mode">
          <p>You are viewing cached and offline fallback storybooks.</p>
        </InlineAlert>
      )}

      {status === "error" && errorMessage && (
        <InlineAlert kind="caution" title="Connection error">
          <p>{errorMessage}</p>
        </InlineAlert>
      )}

      {/* Loading Skeleton */}
      {status === "loading" && (
        <div className="storybooks-grid" aria-busy="true" aria-label="Loading storybooks">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Card key={idx} as="div" className="storybook-card">
              <Skeleton kind="card" label="Loading storybooks…" />
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {status === "empty" && (
        <EmptyState
          title="No books found for this topic. Try another topic, like animals or bedtime."
          action={
            <Button variant="secondary" onClick={() => setSelectedSubject("animals")}>
              View animal stories
            </Button>
          }
        />
      )}

      {/* Ready / Book Grid */}
      {(status === "ready" || status === "offline") && books.length > 0 && (
        <div className="storybooks-grid">
          {books.map((book) => (
            <article key={book.id} className="storybook-card" aria-labelledby={`book-${book.id}`}>
              <div className="storybook-cover-wrapper">
                {book.coverUrl ? (
                  <img
                    src={book.coverUrl}
                    alt={`${book.title} cover`}
                    className="storybook-cover-img"
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className="storybook-cover-placeholder"
                  style={{ display: book.coverUrl ? "none" : "flex" }}
                  aria-hidden="true"
                >
                  <span>📖</span>
                </div>
              </div>

              <div className="storybook-content">
                <h3 id={`book-${book.id}`} className="storybook-title">
                  {book.title}
                </h3>
                {book.authors.length > 0 && (
                  <p className="storybook-author">
                    by {book.authors.join(", ")}
                  </p>
                )}

                {book.subjects.length > 0 && (
                  <div className="storybook-subjects-tags">
                    {book.subjects.slice(0, 3).map((sub, i) => (
                      <span key={i} className="storybook-subject-tag">
                        {sub}
                      </span>
                    ))}
                  </div>
                )}

                <div className="storybook-actions">
                  <Button
                    variant="secondary"
                    className="storybook-play-btn"
                    onClick={() => setActiveBook(book)}
                    aria-label={`Get a play idea for ${book.title}`}
                  >
                    Get a play idea
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Open Library Attribution Credit */}
      <footer className="storybooks-credit">
        <p>
          Books from{" "}
          <a
            href="https://openlibrary.org"
            target="_blank"
            rel="noopener noreferrer"
            className="storybooks-credit-link"
          >
            Open Library
          </a>
          . Observational companion suggestions only.
        </p>
      </footer>

      {/* Play Idea Dialog */}
      {activeBook && (
        <dialog
          className="ls-dialog"
          open
          aria-labelledby="book-dialog-title"
          onCancel={(e) => {
            e.preventDefault();
            setActiveBook(null);
          }}
        >
          <div className="storybook-dialog-header">
            <h2 id="book-dialog-title" className="ls-dialog-title">
              Play idea for {activeBook.title}
            </h2>
            <Badge kind="ai" />
          </div>

          <div className="ls-dialog-body storybook-dialog-body">
            <p className="idea-helper-guidance">
              You know your child best. Change it as you like, and stay close while you play.
            </p>

            <article className="storybook-companion-card">
              <h3 className="storybook-companion-title">
                Interactive Story & Puppet Play
              </h3>
              <p className="storybook-companion-desc">
                As you read <em>{activeBook.title}</em>, use hands or everyday household toys to act out character motions and sounds. Ask your toddler to point to pictures as you name them.
              </p>
              <div className="storybook-companion-safety">
                <strong>Safety reminder:</strong> Always stay close during play and ensure small objects are kept out of reach.
              </div>
            </article>

            <p className="idea-helper-disclaimer">
              Observational play suggestion only. Not developmental assessment.
            </p>
          </div>

          <div className="ls-dialog-actions">
            <Button variant="primary" onClick={() => setActiveBook(null)}>
              Done
            </Button>
          </div>
        </dialog>
      )}
    </section>
  );
}
