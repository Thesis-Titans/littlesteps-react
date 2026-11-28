import { useEffect, useState, type FormEvent } from "react";
import { SegmentedTabs, type SegmentedTabItem } from "../../../components/common";
import { failureKind } from "../../../services/offline";
import { fetchStoryActivity } from "../../ai/api";
import {
  fetchBooks,
  fetchSavedBooks,
  filterFallbackBooks,
  removeBookFromShelf,
  saveBookToShelf,
  searchBooks,
} from "../../catalog/api";
import {
  DOMAINS,
  type BookItem,
  type BookSubject,
  type CatalogActivity,
  type Domain,
  type SavedBook,
} from "../../catalog/types";
import type { AgeBand } from "../../children/types";
import { rhymeToCatalogActivity, type PhilippineRhyme } from "../data/philippineRhymes";
import { BookshelfTab } from "./BookshelfTab";
import { OpenLibraryTab } from "./OpenLibraryTab";
import { RhymesTab } from "./RhymesTab";
import { StoryPlayIdeaDialog, type StoryCompanionIdea } from "./StoryPlayIdeaDialog";

export type StorybooksTabId = "books" | "shelf" | "rhymes";

export interface StorybooksSectionProps {
  childId?: string;
  onPlan?: (activity: CatalogActivity) => void;
  onPlanActivity?: (activity: CatalogActivity) => void;
  ageBand?: AgeBand;
  childNickname?: string;
  /** Controlled active shelf when hosted inside ExploreScreen top-level tabs. */
  controlledTab?: StorybooksTabId;
  /** Invoked when switching shelf (for example, from an empty-shelf "Search storybooks" button). */
  onTabChange?: (tab: StorybooksTabId) => void;
  /** Reports saved bookshelf count to parent navigation tabs. */
  onSavedCountChange?: (count: number) => void;
}

/**
 * Storybooks, Family Bookshelf, and Philippine Rhymes section on the Explore screen.
 */
export function StorybooksSection({
  childId,
  onPlan,
  onPlanActivity,
  ageBand = "12-23m",
  childNickname,
  controlledTab,
  onTabChange,
  onSavedCountChange,
}: StorybooksSectionProps) {
  const planCallback = onPlanActivity ?? onPlan;
  const [internalTab, setInternalTab] = useState<StorybooksTabId>("books");
  const isControlled = controlledTab !== undefined;
  const activeTab = controlledTab ?? internalTab;
  const setActiveTab = (nextTab: StorybooksTabId) => {
    if (!isControlled) setInternalTab(nextTab);
    onTabChange?.(nextTab);
  };
  const [selectedSubject, setSelectedSubject] = useState<BookSubject>("picture_books");
  const [books, setBooks] = useState<BookItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error" | "offline">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [savedBooks, setSavedBooks] = useState<SavedBook[]>([]);
  const [savedStatus, setSavedStatus] = useState<"idle" | "loading" | "ready" | "error">(
    childId ? "loading" : "idle"
  );
  const [savedActionError, setSavedActionError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState<string | null>(null);

  const [activeBook, setActiveBook] = useState<BookItem | null>(null);
  const [storyLoading, setStoryLoading] = useState(false);
  const [storyIdea, setStoryIdea] = useState<StoryCompanionIdea | null>(null);

  useEffect(() => {
    if (activeSearch) return;

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
        const fallback = filterFallbackBooks(selectedSubject);
        if (kind === "offline" || !navigator.onLine) {
          setBooks(fallback.books);
          setStatus(fallback.books.length > 0 ? "offline" : "empty");
        } else if (fallback.books.length > 0) {
          setBooks(fallback.books);
          setStatus("ready");
        } else {
          setStatus("error");
          setErrorMessage(
            "Could not load storybooks right now. Please check your connection and try again."
          );
        }
      });

    return () => {
      current = false;
    };
  }, [selectedSubject, activeSearch]);

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

  useEffect(() => {
    onSavedCountChange?.(savedBooks.length);
  }, [savedBooks.length, onSavedCountChange]);

  const isBookSaved = (bookId: string) => savedBooks.some((b) => b.id === bookId);

  const handleToggleSave = async (book: BookItem | SavedBook) => {
    if (!childId) return;
    setSavedActionError(null);

    if (isBookSaved(book.id)) {
      const prev = savedBooks;
      setSavedBooks((curr) => curr.filter((b) => b.id !== book.id));
      try {
        await removeBookFromShelf(childId, book.id);
      } catch {
        setSavedBooks(prev);
        setSavedActionError(
          `Could not remove "${book.title}" from your bookshelf. Please try again.`
        );
      }
      return;
    }

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
  };

  const handleSearchSubmit = async (e: FormEvent) => {
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

  const handleClosePlayIdea = () => {
    setActiveBook(null);
    setStoryIdea(null);
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
      setStoryIdea({
        title: `Story & Play: ${book.title}`,
        domain: "language",
        instructions: `Read through "${book.title}" together at a calm pace. Use hands or everyday household toys to act out character motions and sounds. Ask ${childNickname ?? "your child"} to point to pictures as you name them.`,
        safetyNotice:
          "Always stay close during play and ensure small objects are kept out of reach.",
        badge: "Suggested by AI",
      });
    } finally {
      setStoryLoading(false);
    }
  };

  const handlePlanRhyme = (rhyme: PhilippineRhyme) => {
    if (!planCallback) return;
    planCallback(rhymeToCatalogActivity(rhyme, childNickname));
  };

  const handlePlanStorybook = () => {
    if (!planCallback || !activeBook) return;
    const ideaTitle = storyIdea?.title ?? `Story & Play: ${activeBook.title}`;
    const matchedDomain: Domain =
      typeof storyIdea?.domain === "string" &&
      (DOMAINS as readonly string[]).includes(storyIdea.domain)
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

    handleClosePlayIdea();
    planCallback(activity);
  };

  const shelfTabs: SegmentedTabItem<StorybooksTabId>[] = [
    { id: "books", label: "Books from Open Library" },
    { id: "shelf", label: "Our Bookshelf", count: savedBooks.length },
    { id: "rhymes", label: "Read & Sing Together (Filipino Rhymes)" },
  ];

  return (
    <section
      className={`storybooks-section ${isControlled ? "storybooks-section-controlled" : ""}`.trim()}
      aria-label={isControlled ? "Storybooks and rhymes" : undefined}
      aria-labelledby={isControlled ? undefined : "storybooks-heading"}
    >
      {!isControlled && (
        <div className="storybooks-header">
          <h2 id="storybooks-heading" className="catalog-title">
            Storybooks
          </h2>
          <p className="catalog-subtitle">
            Recommended picture books and stories from Open Library.
          </p>

          <SegmentedTabs
            ariaLabel="Stories and Rhymes"
            tabs={shelfTabs}
            activeId={activeTab}
            onChange={setActiveTab}
            className="storybooks-tabs"
          />
        </div>
      )}

      {activeTab === "shelf" && (
        <BookshelfTab
          childNickname={childNickname}
          savedBooks={savedBooks}
          savedStatus={savedStatus}
          savedActionError={savedActionError}
          onBrowseBooks={() => setActiveTab("books")}
          onOpenPlayIdea={(book) => void handleOpenPlayIdea(book)}
          onRemoveBook={(book) => void handleToggleSave(book)}
        />
      )}

      {activeTab === "rhymes" && (
        <RhymesTab onPlanRhyme={planCallback ? handlePlanRhyme : undefined} />
      )}

      {activeTab === "books" && (
        <OpenLibraryTab
          books={books}
          status={status}
          errorMessage={errorMessage}
          savedActionError={savedActionError}
          searchQuery={searchQuery}
          activeSearch={activeSearch}
          selectedSubject={selectedSubject}
          canSave={Boolean(childId)}
          isBookSaved={isBookSaved}
          onSearchQueryChange={setSearchQuery}
          onSearchSubmit={(e) => void handleSearchSubmit(e)}
          onClearSearch={handleClearSearch}
          onSelectSubject={(subject) => {
            setStatus("loading");
            setSelectedSubject(subject);
          }}
          onShowAnimalStories={() => {
            setActiveSearch(null);
            setSelectedSubject("animals");
          }}
          onOpenPlayIdea={(book) => void handleOpenPlayIdea(book)}
          onToggleSave={(book) => void handleToggleSave(book)}
        />
      )}

      <StoryPlayIdeaDialog
        book={activeBook}
        loading={storyLoading}
        idea={storyIdea}
        childNickname={childNickname}
        canPlan={Boolean(planCallback)}
        onClose={handleClosePlayIdea}
        onPlanStorybook={handlePlanStorybook}
      />
    </section>
  );
}
