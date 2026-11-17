import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  Icon,
  InlineAlert,
  Skeleton,
} from "../../../components/common";
import {
  BOOK_SUBJECTS,
  BOOK_SUBJECT_LABELS,
  DOMAINS,
  type BookItem,
  type BookSubject,
  type CatalogActivity,
  type Domain,
  type SavedBook,
} from "../../catalog/types";
import {
  fetchBooks,
  fetchSavedBooks,
  filterFallbackBooks,
  removeBookFromShelf,
  saveBookToShelf,
  searchBooks,
} from "../../catalog/api";
import { fetchStoryActivity } from "../../ai/api";
import { failureKind } from "../../../services/offline";
import { PHILIPPINE_RHYMES, type PhilippineRhyme } from "../data/philippineRhymes";
import type { AgeBand } from "../../children/types";

export interface StorybooksSectionProps {
  childId?: string;
  onPlan?: (activity: CatalogActivity) => void;
  onPlanActivity?: (activity: CatalogActivity) => void;
  ageBand?: AgeBand;
  childNickname?: string;
}

export function StorybooksSection({
  childId,
  onPlan,
  onPlanActivity,
  ageBand = "12-23m",
  childNickname,
}: StorybooksSectionProps) {
  const planCallback = onPlanActivity ?? onPlan;
  const [activeTab, setActiveTab] = useState<"books" | "shelf" | "rhymes">("books");
  const [selectedSubject, setSelectedSubject] = useState<BookSubject>("picture_books");
  const [books, setBooks] = useState<BookItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error" | "offline">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Home Bookshelf state (ADR-015)
  const [savedBooks, setSavedBooks] = useState<SavedBook[]>([]);
  const [savedStatus, setSavedStatus] = useState<"idle" | "loading" | "ready" | "error">(childId ? "loading" : "idle");
  const [savedActionError, setSavedActionError] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState<string | null>(null);

  // Play Idea Modal state
  const [activeBook, setActiveBook] = useState<BookItem | null>(null);
  const [storyLoading, setStoryLoading] = useState(false);
  const [storyIdea, setStoryIdea] = useState<{
    title: string;
    domain: string;
    instructions: string;
    safetyNotice: string;
    badge?: string | null;
  } | null>(null);

  useEffect(() => {
    if (activeSearch) return; // Active search overrides subject selection

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
  }, [selectedSubject, activeSearch]);

  // Load saved home storybooks when childId is present
  useEffect(() => {
    if (!childId) return;

    let current = true;

    fetchSavedBooks(childId)
      .then((data) => {
        if (!current) return;
        setSavedBooks(data.books ?? []);
        setSavedStatus("ready");
      })
      .catch(() => {
        if (!current) return;
        setSavedStatus("error");
      });

    return () => {
      current = false;
    };
  }, [childId]);

  const isBookSaved = (bookId: string) => savedBooks.some((b) => b.id === bookId);

  const handleToggleSave = async (book: BookItem | SavedBook) => {
    if (!childId) return;
    setSavedActionError(null);
    const alreadySaved = isBookSaved(book.id);

    if (alreadySaved) {
      const prev = savedBooks;
      setSavedBooks((curr) => curr.filter((b) => b.id !== book.id));
      try {
        await removeBookFromShelf(childId, book.id);
      } catch {
        setSavedBooks(prev);
        setSavedActionError(`Could not remove "${book.title}" from your bookshelf. Please try again.`);
      }
    } else {
      try {
        const saved = await saveBookToShelf(childId, {
          id: book.id,
          title: book.title,
          authors: book.authors,
          coverUrl: book.coverUrl,
          subjects: book.subjects,
        });
        setSavedBooks((curr) => [saved, ...curr.filter((b) => b.id !== saved.id)]);
      } catch {
        setSavedActionError(`Could not save "${book.title}" to your bookshelf. Please try again.`);
      }
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setStatus("loading");
    setActiveSearch(query);

    try {
      const data = await searchBooks(query, 12);
      if (data.books.length === 0) {
        setStatus("empty");
      } else {
        setBooks(data.books);
        setStatus("ready");
      }
    } catch {
      const fallback = filterFallbackBooks(selectedSubject);
      setBooks(fallback.books);
      setStatus("offline");
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setActiveSearch(null);
  };

  const handleOpenPlayIdea = async (book: BookItem) => {
    setActiveBook(book);
    setStoryLoading(true);
    try {
      const res = await fetchStoryActivity({
        bookTitle: book.title,
        subjects: book.subjects,
        ageBand,
      });
      setStoryIdea({
        title: res.suggestion.title,
        domain: res.suggestion.domain,
        instructions: res.suggestion.instructions,
        safetyNotice: res.suggestion.safetyNotice,
        badge: res.provenance.badge,
      });
    } catch {
      // Default safe companion fallback
      setStoryIdea({
        title: `Story & Play: ${book.title}`,
        domain: "language",
        instructions: `Read through "${book.title}" together at a calm pace. Use hands or everyday household toys to act out character motions and sounds. Ask ${childNickname ?? "your child"} to point to pictures as you name them.`,
        safetyNotice: "Always stay close during play and ensure small objects are kept out of reach.",
        badge: "Suggested by AI",
      });
    } finally {
      setStoryLoading(false);
    }
  };

  const handlePlanRhyme = (rhyme: PhilippineRhyme) => {
    if (!planCallback) return;
    const activity: CatalogActivity = {
      id: rhyme.id,
      title: `Sing: ${rhyme.title}`,
      type: "rhyme",
      language: rhyme.language,
      setting: "indoor",
      ageBand,
      domain: rhyme.domain,
      durationMinutes: rhyme.durationMinutes,
      durationEstimate: `${rhyme.durationMinutes} mins`,
      materials: rhyme.materials,
      instructions: [
        `Sing "${rhyme.title}" together with ${childNickname ?? "your child"}.`,
        rhyme.actionPrompt,
        ...rhyme.lyrics.slice(0, 4),
      ],
      provenanceSource: "Traditional Philippine Nursery Rhyme & ECCD Play",
      status: "synthetic_fixture",
      limitations: "Provisional Academic Reference — Pending Review. Educational prompt only; not a clinical milestone.",
    };
    planCallback(activity);
  };

  const handlePlanStorybook = () => {
    if (!planCallback || !activeBook) return;
    const ideaTitle = storyIdea?.title ?? `Story & Play: ${activeBook.title}`;
    const matchedDomain: Domain =
      typeof storyIdea?.domain === "string" && (DOMAINS as readonly string[]).includes(storyIdea.domain)
        ? (storyIdea.domain as Domain)
        : "language";
    const activity: CatalogActivity = {
      id: `story-${activeBook.id.toLowerCase().replace(/[^a-z0-9-]/g, "-")}`,
      title: ideaTitle,
      type: "story",
      language: "en",
      setting: "indoor",
      ageBand,
      domain: matchedDomain,
      durationMinutes: 10,
      durationEstimate: "10 mins",
      materials: ["Storybook", "Everyday household toys"],
      instructions: [
        storyIdea?.instructions ??
          `Read "${activeBook.title}" together. Encourage your child to point to characters and make playful sound effects.`,
      ],
      provenanceSource: `Story companion adapted from "${activeBook.title}" via Open Library`,
      status: "reviewed_approved",
      limitations: storyIdea?.safetyNotice ?? "Ensure adult supervision during shared reading.",
    };
    setActiveBook(null);
    setStoryIdea(null);
    planCallback(activity);
  };

  return (
    <section className="storybooks-section" aria-labelledby="storybooks-heading">
      <div className="storybooks-header">
        <h2 id="storybooks-heading" className="catalog-title">
          Storybooks
        </h2>
        <p className="catalog-subtitle">
          Recommended picture books and stories from Open Library.
        </p>

        {/* Tab Switcher: Open Library vs Our Bookshelf vs Philippine Rhymes */}
        <div className="storybooks-tabs" role="tablist" aria-label="Stories and Rhymes">
          <Button
            variant={activeTab === "books" ? "primary" : "secondary"}
            onClick={() => setActiveTab("books")}
            role="tab"
            aria-selected={activeTab === "books"}
          >
            Books from Open Library
          </Button>
          <Button
            variant={activeTab === "shelf" ? "primary" : "secondary"}
            onClick={() => setActiveTab("shelf")}
            role="tab"
            aria-selected={activeTab === "shelf"}
          >
            {savedBooks.length > 0 ? `Our Bookshelf (${savedBooks.length})` : "Our Bookshelf"}
          </Button>
          <Button
            variant={activeTab === "rhymes" ? "primary" : "secondary"}
            onClick={() => setActiveTab("rhymes")}
            role="tab"
            aria-selected={activeTab === "rhymes"}
          >
            Read &amp; Sing Together (Filipino Rhymes)
          </Button>
        </div>
      </div>

      {/* Our Bookshelf Tab */}
      {activeTab === "shelf" && (
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
                <Button variant="secondary" onClick={() => setActiveTab("books")}>
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
                <article key={book.id} className="storybook-card" aria-labelledby={`shelf-book-${book.id}`}>
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
                      <Icon name="book" size={32} />
                    </div>
                  </div>

                  <div className="storybook-content">
                    <h3 id={`shelf-book-${book.id}`} className="storybook-title">
                      {book.title}
                    </h3>
                    {book.authors.length > 0 && (
                      <p className="storybook-author">
                        by {book.authors.join(", ")}
                      </p>
                    )}

                    {book.subjects && book.subjects.length > 0 && (
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
                        onClick={() =>
                          handleOpenPlayIdea({
                            id: book.id,
                            title: book.title,
                            authors: book.authors,
                            coverUrl: book.coverUrl ?? null,
                            subjects: book.subjects,
                            source: "Our Bookshelf",
                          })
                        }
                        aria-label={`Get a play idea for ${book.title}`}
                      >
                        Get a play idea
                      </Button>
                      <Button
                        variant="text"
                        className="storybook-bookmark-btn is-saved"
                        onClick={() => handleToggleSave(book)}
                        aria-label={`Remove ${book.title} from bookshelf`}
                        title="Remove from bookshelf"
                      >
                        <Icon name="bookmark-check" size={18} />
                        <span>Saved</span>
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Philippine Action Rhymes Tab */}
      {activeTab === "rhymes" && (
        <div className="philippine-rhymes-shelf">
          <div className="rhymes-intro">
            <p>
              No physical book at home? Read, recite, and sing these classic Philippine nursery rhymes together with interactive action cues!
            </p>
          </div>

          {/* Visible Provenance & Non-Diagnostic Notice */}
          <InlineAlert kind="info" title="Provisional Academic Reference — Pending Review">
            <p>Educational prompt only; not a clinical milestone. Traditional cultural songs awaiting subject-matter adviser review.</p>
          </InlineAlert>

          <div className="storybooks-grid">
            {PHILIPPINE_RHYMES.map((rhyme) => (
              <Card key={rhyme.id} as="article" className="storybook-card rhyme-card">
                <div className="rhyme-body">
                  <div className="rhyme-meta">
                    <span className="storybook-subject-tag">{rhyme.domainLabel}</span>
                    <span className="rhyme-duration">{rhyme.durationMinutes} mins</span>
                  </div>

                  <div className="rhyme-badge">
                    <Badge kind="source">Provisional Academic Reference — Pending Review</Badge>
                  </div>

                  <h3 className="storybook-title">{rhyme.title}</h3>
                  <p className="storybook-author">{rhyme.subtitle}</p>

                  <div className="rhyme-lyrics">
                    {rhyme.lyrics.map((line, idx) => (
                      <div key={idx}>{line}</div>
                    ))}
                  </div>

                  <p className="rhyme-cue">
                    <strong>Action cue:</strong> {rhyme.actionPrompt}
                  </p>
                </div>

                <div className="rhyme-actions">
                  {planCallback && (
                    <Button
                      variant="secondary"
                      fullWidth
                      onClick={() => handlePlanRhyme(rhyme)}
                    >
                      Add to today&apos;s plan
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Open Library Books Shelf Tab */}
      {activeTab === "books" && (
        <>
          {/* Live Search and Subject filter chips */}
          <div className="storybooks-search">
            <form onSubmit={handleSearchSubmit} className="storybooks-search-form">
              <input
                type="search"
                className="ls-control storybooks-search-input"
                placeholder="Search books you have at home..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search storybooks by title or author"
              />
              <Button type="submit" variant="secondary">
                Search
              </Button>
              {activeSearch && (
                <Button type="button" variant="text" onClick={handleClearSearch}>
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
                      onClick={() => {
                        setStatus("loading");
                        setSelectedSubject(subject);
                      }}
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
                <Button variant="secondary" onClick={() => { setActiveSearch(null); setSelectedSubject("animals"); }}>
                  View animal stories
                </Button>
              }
            />
          )}

          {/* Ready / Book Grid */}
          {(status === "ready" || status === "offline") && books.length > 0 && (
            <div className="storybooks-grid">
              {books.map((book) => {
                const isSaved = isBookSaved(book.id);
                return (
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
                        <Icon name="book" size={32} />
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
                          onClick={() => handleOpenPlayIdea(book)}
                          aria-label={`Get a play idea for ${book.title}`}
                        >
                          Get a play idea
                        </Button>
                        {childId && (
                          <Button
                            variant={isSaved ? "secondary" : "text"}
                            className={`storybook-bookmark-btn ${isSaved ? "is-saved" : ""}`}
                            onClick={() => handleToggleSave(book)}
                            aria-label={
                              isSaved
                                ? `Remove ${book.title} from your shelf`
                                : `Save ${book.title} to your shelf`
                            }
                            aria-pressed={isSaved}
                            title={isSaved ? "On your shelf" : "Save to shelf"}
                          >
                            <Icon name={isSaved ? "bookmark-check" : "bookmark"} size={18} />
                            <span>{isSaved ? "Saved" : "Save"}</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
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
        </>
      )}

      {/* Play Idea Dialog with Closed-Loop Planning (ADR-013, ADR-015) */}
      {activeBook && (
        <dialog
          className="ls-dialog storybook-play-dialog"
          open
          aria-labelledby="book-dialog-title"
          onCancel={(e) => {
            e.preventDefault();
            setActiveBook(null);
            setStoryIdea(null);
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

            {storyLoading ? (
              <div className="storybook-companion-loading">
                <p>Generating personalized play companion with AI…</p>
              </div>
            ) : (
              <article className="storybook-companion-card">
                <h3 className="storybook-companion-title">
                  {storyIdea?.title ?? "Interactive Story & Puppet Play"}
                </h3>
                <p className="storybook-companion-desc">
                  {storyIdea?.instructions ??
                    `As you read ${activeBook.title}, use hands or everyday household toys to act out character motions and sounds. Ask your toddler to point to pictures as you name them.`}
                </p>
                <div className="storybook-companion-safety">
                  <strong>Safety reminder:</strong> {storyIdea?.safetyNotice ?? "Always stay close during play and ensure small objects are kept out of reach."}
                </div>
              </article>
            )}

            <p className="idea-helper-disclaimer">
              Observational play suggestion only. Not developmental assessment.
            </p>
          </div>

          <div className="ls-dialog-actions storybook-dialog-actions">
            {activeBook.id ? (
              <a
                href={`https://openlibrary.org/works/${activeBook.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ls-button ls-button-secondary storybook-borrow-link"
                aria-label={`Read or borrow ${activeBook.title} on Open Library (opens in new tab)`}
              >
                <Icon name="book" size={16} />
                <span>Read or borrow</span>
                <span aria-hidden="true">↗</span>
              </a>
            ) : <span />}
            <div className="storybook-dialog-buttons">
              <Button
                variant="secondary"
                onClick={() => {
                  setActiveBook(null);
                  setStoryIdea(null);
                }}
              >
                Done
              </Button>
              {planCallback && (
                <Button
                  variant="primary"
                  onClick={handlePlanStorybook}
                >
                  Add to today&apos;s plan
                </Button>
              )}
            </div>
          </div>
        </dialog>
      )}
    </section>
  );
}
