// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StorybooksSection } from "./components/StorybooksSection";
import * as catalogApi from "../catalog/api";

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
    expect(screen.getByText(/Books from/)).toBeTruthy();
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
      // Offline fallback items are displayed
      expect(screen.getByRole("heading", { name: "The Very Hungry Caterpillar", level: 3 })).toBeTruthy();
    });
  });

  it("opens play idea modal with AI badge, guidance, and safety reminders", async () => {
    vi.spyOn(catalogApi, "fetchBooks").mockResolvedValueOnce({
      subject: "picture_books",
      books: mockBooks,
      source: "Open Library",
      count: 2,
    });

    render(<StorybooksSection />);

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
    expect(
      screen.getByText("You know your child best. Change it as you like, and stay close while you play.")
    ).toBeTruthy();
    expect(
      screen.getByText(/Always stay close during play/i)
    ).toBeTruthy();
    expect(
      screen.getByText("Observational play suggestion only. Not developmental assessment.")
    ).toBeTruthy();

    const doneBtn = screen.getByRole("button", { name: "Done" });
    fireEvent.click(doneBtn);

    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
