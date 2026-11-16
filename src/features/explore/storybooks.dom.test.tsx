// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StorybooksSection } from "./components/StorybooksSection";
import * as catalogApi from "../catalog/api";
import * as aiApi from "../ai/api";

const mockBooks = [
  {
    id: "OL1",
    title: "The Very Hungry Caterpillar",
    authors: ["Eric Carle"],
    firstPublishYear: 1969,
    coverUrl: "https://covers.openlibrary.org/b/id/1-M.jpg",
    subjects: ["Animals", "Counting"],
    source: "Open Library",
  },
  {
    id: "OL2",
    title: "Goodnight Moon",
    authors: ["Margaret Wise Brown"],
    firstPublishYear: 1947,
    coverUrl: null,
    subjects: ["Bedtime", "Stories in rhyme"],
    source: "Open Library",
  },
];

describe("StorybooksSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("loads and displays books with attribution credit", async () => {
    vi.spyOn(catalogApi, "fetchBooks").mockResolvedValueOnce({
      subject: "picture_books",
      books: mockBooks,
      source: "Open Library",
      count: 2,
    });

    render(<StorybooksSection />);

    expect(screen.getByRole("heading", { name: "Storybooks", level: 2 })).toBeTruthy();
    expect(screen.getByText(/Recommended picture books and stories from Open Library/i)).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "The Very Hungry Caterpillar", level: 3 })).toBeTruthy();
      expect(screen.getByRole("heading", { name: "Goodnight Moon", level: 3 })).toBeTruthy();
    });

    expect(screen.getByText(/Eric Carle/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Open Library" })).toBeTruthy();
  });

  it("filters books when selecting different subjects", async () => {
    const fetchSpy = vi.spyOn(catalogApi, "fetchBooks")
      .mockResolvedValueOnce({
        subject: "picture_books",
        books: mockBooks,
        source: "Open Library",
        count: 2,
      })
      .mockResolvedValueOnce({
        subject: "bedtime",
        books: [mockBooks[1]],
        source: "Open Library",
        count: 1,
      });

    render(<StorybooksSection />);

    await waitFor(() => {
      expect(screen.getByText("The Very Hungry Caterpillar")).toBeTruthy();
    });

    const bedtimeChip = screen.getByRole("button", { name: "Bedtime" });
    fireEvent.click(bedtimeChip);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith("bedtime");
      expect(screen.getByText("Goodnight Moon")).toBeTruthy();
    });
  });

  it("displays empty state when no books are returned", async () => {
    vi.spyOn(catalogApi, "fetchBooks").mockResolvedValueOnce({
      subject: "colors",
      books: [],
      source: "Open Library",
      count: 0,
    });

    render(<StorybooksSection />);

    await waitFor(() => {
      expect(
        screen.getByText("No books found for this topic. Try another topic, like animals or bedtime.")
      ).toBeTruthy();
    });
  });

  it("falls back to offline books when network fails", async () => {
    vi.spyOn(catalogApi, "fetchBooks").mockRejectedValueOnce(new TypeError("Failed to fetch"));

    render(<StorybooksSection />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "The Very Hungry Caterpillar", level: 3 })).toBeTruthy();
    });
  });

  it("opens play idea modal and allows adding to today plan", async () => {
    vi.spyOn(catalogApi, "fetchBooks").mockResolvedValueOnce({
      subject: "picture_books",
      books: mockBooks,
      source: "Open Library",
      count: 2,
    });

    vi.spyOn(aiApi, "fetchStoryActivity").mockResolvedValueOnce({
      bookTitle: "The Very Hungry Caterpillar",
      suggestion: {
        title: "Sock Caterpillar Puppet Play",
        domain: "cognitive",
        instructions: "Feed pretend food to a sock caterpillar puppet.",
        safetyNotice: "Always stay close during play and ensure small objects are kept out of reach.",
      },
      provenance: {
        tier: 1,
        source: "Gemini",
        badge: "Suggested by AI",
        disclaimer: "Observational play suggestion only. Not developmental assessment.",
      },
    });

    const onPlanSpy = vi.fn();
    render(<StorybooksSection onPlan={onPlanSpy} ageBand="12-23m" childNickname="Maya" />);

    await waitFor(() => {
      expect(screen.getByText("The Very Hungry Caterpillar")).toBeTruthy();
    });

    const playIdeaBtn = screen.getByRole("button", {
      name: "Get a play idea for The Very Hungry Caterpillar",
    });
    fireEvent.click(playIdeaBtn);

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Play idea for The Very Hungry Caterpillar", level: 2 })
    ).toBeTruthy();
    expect(screen.getByText("Suggested by AI")).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText("Sock Caterpillar Puppet Play")).toBeTruthy();
      expect(screen.getByText(/Always stay close during play/i)).toBeTruthy();
    });

    const borrowLink = screen.getByRole("link", { name: /Read or borrow The Very Hungry Caterpillar on Open Library/i });
    expect(borrowLink).toBeTruthy();
    expect(borrowLink.getAttribute("href")).toBe("https://openlibrary.org/works/OL1");
    expect(borrowLink.getAttribute("target")).toBe("_blank");
    expect(borrowLink.getAttribute("rel")).toBe("noopener noreferrer");

    const addToPlanBtn = screen.getByRole("button", { name: "Add to today's plan" });
    fireEvent.click(addToPlanBtn);

    expect(onPlanSpy).toHaveBeenCalledTimes(1);
    expect(onPlanSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.stringMatching(/^story-[a-z0-9-]+$/),
        title: "Sock Caterpillar Puppet Play",
        type: "story",
        ageBand: "12-23m",
        domain: "cognitive",
      })
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("searches books via live Open Library search", async () => {
    vi.spyOn(catalogApi, "fetchBooks").mockResolvedValueOnce({
      subject: "picture_books",
      books: mockBooks,
      source: "Open Library",
      count: 2,
    });

    const searchSpy = vi.spyOn(catalogApi, "searchBooks").mockResolvedValueOnce({
      subject: "picture_books",
      books: [
        {
          id: "OL3",
          title: "Corduroy",
          authors: ["Don Freeman"],
          firstPublishYear: 1968,
          coverUrl: null,
          subjects: ["Bears", "Department stores"],
          source: "Open Library Search",
        },
      ],
      source: "Open Library Search",
      count: 1,
    });

    render(<StorybooksSection />);

    await waitFor(() => {
      expect(screen.getByText("The Very Hungry Caterpillar")).toBeTruthy();
    });

    const searchInput = screen.getByPlaceholderText(/Search books you have at home/i);
    fireEvent.change(searchInput, { target: { value: "Corduroy" } });

    const searchBtn = screen.getByRole("button", { name: "Search" });
    fireEvent.click(searchBtn);

    await waitFor(() => {
      expect(searchSpy).toHaveBeenCalledWith("Corduroy", 12);
      expect(screen.getByText("Corduroy")).toBeTruthy();
    });
  });

  it("switches to Philippine nursery rhymes tab and plans rhyme play with pending review status", async () => {
    vi.spyOn(catalogApi, "fetchBooks").mockResolvedValueOnce({
      subject: "picture_books",
      books: mockBooks,
      source: "Open Library",
      count: 2,
    });

    const onPlanSpy = vi.fn();
    render(<StorybooksSection onPlan={onPlanSpy} ageBand="12-23m" childNickname="Maya" />);

    const rhymesTab = screen.getByRole("tab", { name: /Read & Sing Together/i });
    fireEvent.click(rhymesTab);

    // Verify headings
    expect(screen.getByRole("heading", { name: "Bahay Kubo", level: 3 })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Tong.*Pakitong-kitong/i, level: 3 })).toBeTruthy();

    // Verify visible pending review provenance notice and badge
    expect(screen.getAllByText(/Provisional Academic Reference — Pending Review/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Educational prompt only; not a clinical milestone/i)).toBeTruthy();

    const planButtons = screen.getAllByRole("button", { name: "Add to today's plan" });
    fireEvent.click(planButtons[0]);

    expect(onPlanSpy).toHaveBeenCalledTimes(1);
    expect(onPlanSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "rhyme-bahay-kubo",
        title: "Sing: Bahay Kubo",
        type: "rhyme",
        language: "fil",
        domain: "cognitive",
        status: "synthetic_fixture",
        limitations: "Provisional Academic Reference — Pending Review. Educational prompt only; not a clinical milestone.",
      })
    );
  });

  it("plans rhyme activity using onPlanActivity callback alias", async () => {
    vi.spyOn(catalogApi, "fetchBooks").mockResolvedValueOnce({
      subject: "picture_books",
      books: mockBooks,
      source: "Open Library",
      count: 2,
    });

    const onPlanActivitySpy = vi.fn();
    render(<StorybooksSection onPlanActivity={onPlanActivitySpy} ageBand="12-23m" childNickname="Maya" />);

    const rhymesTab = screen.getByRole("tab", { name: /Read & Sing Together/i });
    fireEvent.click(rhymesTab);

    const planButtons = screen.getAllByRole("button", { name: "Add to today's plan" });
    fireEvent.click(planButtons[0]);

    expect(onPlanActivitySpy).toHaveBeenCalledTimes(1);
    expect(onPlanActivitySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "rhyme-bahay-kubo",
        status: "synthetic_fixture",
        limitations: "Provisional Academic Reference — Pending Review. Educational prompt only; not a clinical milestone.",
      })
    );
  });
});
