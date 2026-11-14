// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChildContext } from "../children/context";
import type { Child, ChildState } from "../children/types";
import { JournalScreen } from "./JournalScreen";
import * as journalApi from "./api";

const mockMaya: Child = {
  id: "child-1",
  nickname: "Maya",
  ageBand: "12-23m",
  createdAt: "2026-10-01",
  updatedAt: "2026-10-01",
};

const mockNotes = [
  {
    id: "n1",
    childId: "child-1",
    entryDate: "2026-11-14",
    content: "Stacked four blocks today with giant smiles.",
    createdAt: "2026-11-14T10:00:00Z",
    updatedAt: "2026-11-14T10:00:00Z",
  },
  {
    id: "n2",
    childId: "child-1",
    entryDate: "2026-11-10",
    content: "Explored sensory textures with leaves outside.",
    createdAt: "2026-11-10T09:00:00Z",
    updatedAt: "2026-11-10T09:00:00Z",
  },
];

function renderJournal(activeChild: Child | null = mockMaya) {
  const childState: ChildState = {
    children: activeChild ? [activeChild] : [],
    activeChild,
    status: "ready",
    error: null,
    setActiveChild: vi.fn(),
    refresh: vi.fn(),
    addChild: vi.fn(),
    editChild: vi.fn(),
  };

  return render(
    <ChildContext.Provider value={childState}>
      <MemoryRouter>
        <JournalScreen />
      </MemoryRouter>
    </ChildContext.Provider>
  );
}

describe("JournalScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
      this.removeAttribute("open");
    };
  });

  afterEach(() => {
    cleanup();
  });

  it("renders privacy boundary and existing observation notes", async () => {
    vi.spyOn(journalApi, "listJournalEntries").mockResolvedValueOnce(mockNotes);

    renderJournal();

    expect(screen.getByRole("heading", { name: "Journal", level: 1 })).toBeTruthy();
    expect(screen.getByText(/Only you can see these notes/i)).toBeTruthy();
    expect(screen.getByText("New observation note")).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText("Stacked four blocks today with giant smiles.")).toBeTruthy();
      expect(screen.getByText("Explored sensory textures with leaves outside.")).toBeTruthy();
    });

    const privateBadges = screen.getAllByText("Private");
    expect(privateBadges.length).toBeGreaterThanOrEqual(2);
  });

  it("creates a new observation note with character counter and limits", async () => {
    vi.spyOn(journalApi, "listJournalEntries").mockResolvedValueOnce([]);
    const createSpy = vi.spyOn(journalApi, "createJournalEntry").mockResolvedValueOnce({
      id: "n3",
      childId: "child-1",
      entryDate: "2026-11-14",
      content: "First time pointing to shoes when asked.",
      createdAt: "2026-11-14T11:00:00Z",
      updatedAt: "2026-11-14T11:00:00Z",
    });

    renderJournal();

    await waitFor(() => {
      expect(screen.getByText("Your journal is private to you.")).toBeTruthy();
    });

    const textarea = screen.getByLabelText(/Observation notes/i);
    expect(screen.getByText("0 / 2000")).toBeTruthy();

    fireEvent.change(textarea, { target: { value: "First time pointing to shoes when asked." } });
    expect(screen.getByText("40 / 2000")).toBeTruthy();

    const saveBtn = screen.getByRole("button", { name: "Save note" });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith("child-1", expect.objectContaining({
        content: "First time pointing to shoes when asked.",
      }));
      expect(screen.getByText("First time pointing to shoes when asked.")).toBeTruthy();
      expect(screen.getByText("Note saved to journal.")).toBeTruthy();
    });
  });

  it("deleting a note prompts with confirmation modal", async () => {
    vi.spyOn(journalApi, "listJournalEntries").mockResolvedValueOnce(mockNotes);
    const deleteSpy = vi.spyOn(journalApi, "deleteJournalEntry").mockResolvedValueOnce();

    renderJournal();

    await waitFor(() => {
      expect(screen.getByText("Stacked four blocks today with giant smiles.")).toBeTruthy();
    });

    const deleteButtons = screen.getAllByRole("button", { name: /Delete note/i });
    fireEvent.click(deleteButtons[0]);

    // Dialog opens
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Delete this note?", level: 2 })).toBeTruthy();
    expect(screen.getByText("This observation will be permanently removed. This cannot be undone.")).toBeTruthy();

    // Confirm delete
    const confirmBtn = screen.getByRole("button", { name: "Delete note" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith("child-1", "n1");
      expect(screen.getByText("Note deleted.")).toBeTruthy();
      expect(screen.queryByText("Stacked four blocks today with giant smiles.")).toBeNull();
    });
  });

  it("handles offline submit by keeping draft and showing retry", async () => {
    vi.spyOn(journalApi, "listJournalEntries").mockResolvedValueOnce([]);
    vi.spyOn(journalApi, "createJournalEntry").mockRejectedValueOnce(new TypeError("Failed to fetch"));

    // Mock navigator.onLine as false
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });

    renderJournal();

    await waitFor(() => {
      expect(screen.getByText("Your journal is private to you.")).toBeTruthy();
    });

    const textarea = screen.getByLabelText(/Observation notes/i);
    fireEvent.change(textarea, { target: { value: "Offline note draft that should not disappear." } });

    const saveBtn = screen.getByRole("button", { name: "Save note" });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText("You're offline. Your note wasn't saved.")).toBeTruthy();
      expect((textarea as HTMLTextAreaElement).value).toBe("Offline note draft that should not disappear.");
      expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();
    });

    // Reset navigator.onLine
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
  });
});
