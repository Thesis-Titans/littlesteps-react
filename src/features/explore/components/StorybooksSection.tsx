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
} from "../../catalog/types";
import { fetchBooks, filterFallbackBooks, searchBooks } from "../../catalog/api";
import { fetchStoryActivity } from "../../ai/api";
import { failureKind } from "../../../services/offline";
import { PHILIPPINE_RHYMES, type PhilippineRhyme } from "../data/philippineRhymes";
import type { AgeBand } from "../../children/types";

export interface StorybooksSectionProps {
  onPlan?: (activity: CatalogActivity) => void;
  onPlanActivity?: (activity: CatalogActivity) => void;
  ageBand?: AgeBand;
  childNickname?: string;
}

export function StorybooksSection({
  onPlan,
  onPlanActivity,
  ageBand = "12-23m",
  childNickname,
}: StorybooksSectionProps) {
  const planCallback = onPlanActivity ?? onPlan;
  const [activeTab, setActiveTab] = useState<"books" | "rhymes">("books");
  const [selectedSubject, setSelectedSubject] = useState<BookSubject>("picture_books");
  const [books, setBooks] = useState<BookItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error" | "offline">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

        {/* Tab Switcher: Open Library vs Philippine Rhymes */}
        <div className="storybooks-tabs" role="tablist" aria-label="Stories and Rhymes" style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-8)", marginTop: "var(--space-12)" }}>
          <Button
            variant={activeTab === "books" ? "primary" : "secondary"}
            onClick={() => setActiveTab("books")}
            role="tab"
            aria-selected={activeTab === "books"}
          >
            Books from Open Library
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

      {activeTab === "rhymes" ? (
        /* Read & Sing Together: Philippine ECCD Action Rhymes */
        <div className="philippine-rhymes-shelf" style={{ display: "flex", flexDirection: "column", gap: "var(--space-16)" }}>
          <div className="rhymes-intro" style={{ background: "var(--color-surface-soft-green)", padding: "var(--space-12) var(--space-16)", borderRadius: "var(--radius-card)" }}>
            <p style={{ margin: 0, font: "var(--font-body-small)", color: "var(--color-text-primary)" }}>
              No physical book at home? Read, recite, and sing these classic Philippine nursery rhymes together with interactive action cues!
            </p>
          </div>

          {/* Visible Provenance & Non-Diagnostic Notice */}
          <InlineAlert kind="info" title="Provisional Academic Reference — Pending Review">
            <p>Educational prompt only; not a clinical milestone. Traditional cultural songs awaiting subject-matter adviser review.</p>
          </InlineAlert>

          <div className="storybooks-grid">
            {PHILIPPINE_RHYMES.map((rhyme) => (
              <Card key={rhyme.id} as="article" className="storybook-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ padding: "var(--space-16)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-8)" }}>
                    <span className="storybook-subject-tag">{rhyme.domainLabel}</span>
                    <span style={{ font: "var(--font-meta)", color: "var(--color-text-secondary)" }}>{rhyme.durationMinutes} mins</span>
                  </div>

                  <div style={{ marginBottom: "var(--space-8)" }}>
                    <Badge kind="source">Provisional Academic Reference — Pending Review</Badge>
                  </div>

                  <h3 className="storybook-title" style={{ marginBottom: "var(--space-4)" }}>{rhyme.title}</h3>
                  <p className="storybook-author" style={{ marginBottom: "var(--space-12)" }}>{rhyme.subtitle}</p>

                  <div style={{ background: "var(--color-brand-mist)", padding: "var(--space-12)", borderRadius: "var(--radius-control)", marginBottom: "var(--space-12)", fontStyle: "italic", fontSize: "0.9rem", lineHeight: "1.5" }}>
                    {rhyme.lyrics.map((line, idx) => (
                      <div key={idx}>{line}</div>
                    ))}
                  </div>

                  <p style={{ font: "var(--font-body-small)", color: "var(--color-text-primary)", margin: 0 }}>
                    <strong>Action cue:</strong> {rhyme.actionPrompt}
                  </p>
                </div>

                <div style={{ padding: "var(--space-16)", paddingTop: 0, marginTop: "auto" }}>
                  {planCallback && (
                    <Button
                      variant="secondary"
                      style={{ width: "100%" }}
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
      ) : (
        /* Open Library Books Shelf */
        <>
          {/* Live Search and Subject filter chips */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-12)" }}>
            <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "var(--space-8)", maxWidth: "480px" }}>
              <input
                type="search"
                className="ls-input"
                placeholder="Search books you have at home..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1, minHeight: "var(--size-touch-target-min)" }}
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
        </>
      )}

      {/* Play Idea Dialog with Closed-Loop Planning */}
      {activeBook && (
        <dialog
          className="ls-dialog"
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
              <div style={{ padding: "var(--space-24)", textAlign: "center" }}>
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

          <div className="ls-dialog-actions" style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-8)", justifyContent: "space-between", alignItems: "center" }}>
            {activeBook.id ? (
              <a
                href={`https://openlibrary.org/works/${activeBook.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ls-button ls-button-secondary"
                style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "var(--space-8)" }}
                aria-label={`Read or borrow ${activeBook.title} on Open Library (opens in new tab)`}
              >
                <Icon name="book" size={16} />
                <span>Read or borrow</span>
                <span aria-hidden="true">↗</span>
              </a>
            ) : <span />}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-8)" }}>
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
