// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChildContext } from "../../children/context";
import type { Child, ChildState } from "../../children/types";
import { JournalScreen } from "../JournalScreen";
import * as journalApi from "../api";

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

  it("renders privacy boundary and existing notes", async () => {
    vi.spyOn(journalApi, "listJournalEntries").mockResolvedValueOnce(mockNotes);

    renderJournal();

    expect(screen.getByRole("heading", { name: "Journal", level: 1 })).toBeTruthy();
    expect(screen.getByText(/Only you can see your notes/i)).toBeTruthy();
    expect(screen.queryByText(/Private by design/i)).toBeNull();
    expect(screen.getByText("New note")).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText("Stacked four blocks today with giant smiles.")).toBeTruthy();
      expect(screen.getByText("Explored sensory textures with leaves outside.")).toBeTruthy();
    });

    const privateBadges = screen.getAllByText("Private");
    expect(privateBadges.length).toBeGreaterThanOrEqual(2);
  });

  it("creates a new note with character counter and limits", async () => {
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
      expect(screen.getByText("No notes for Maya yet")).toBeTruthy();
    });

    const textarea = screen.getByLabelText("What did you see?");
    expect(screen.getByText("0 / 2000")).toBeTruthy();

    fireEvent.change(textarea, { target: { value: "First time pointing to shoes when asked." } });
    expect(screen.getByText("40 / 2000")).toBeTruthy();
    // The spoken status stays empty until the limit is close, so it is not read on every keystroke.
    expect(screen.queryByText("Close to the 2,000-character limit.")).toBeNull();
    fireEvent.change(textarea, { target: { value: "a".repeat(1850) } });
    expect(screen.getByText("Close to the 2,000-character limit.")).toBeTruthy();
    fireEvent.change(textarea, { target: { value: "First time pointing to shoes when asked." } });

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
    expect(screen.getByText("This note will be deleted for good. This cannot be undone.")).toBeTruthy();

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
      expect(screen.getByText("No notes for Maya yet")).toBeTruthy();
    });

    const textarea = screen.getByLabelText("What did you see?");
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

  it("clears unsaved draft text when switching to a different active child", async () => {
    const childB: Child = {
      id: "child-2",
      nickname: "Leo",
      ageBand: "24-35m",
      createdAt: "2026-10-02",
      updatedAt: "2026-10-02",
    };
    vi.spyOn(journalApi, "listJournalEntries").mockResolvedValue([]);

    const makeState = (active: Child): ChildState => ({
      children: [mockMaya, childB],
      activeChild: active,
      status: "ready",
      error: null,
      setActiveChild: vi.fn(),
      refresh: vi.fn(),
      addChild: vi.fn(),
      editChild: vi.fn(),
    });

    const { rerender } = render(
      <ChildContext.Provider value={makeState(mockMaya)}>
        <MemoryRouter>
          <JournalScreen />
        </MemoryRouter>
      </ChildContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText("No notes for Maya yet")).toBeTruthy();
    });

    const textarea = screen.getByLabelText("What did you see?") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "Private note drafted for Maya." } });
    expect(textarea.value).toBe("Private note drafted for Maya.");

    rerender(
      <ChildContext.Provider value={makeState(childB)}>
        <MemoryRouter>
          <JournalScreen />
        </MemoryRouter>
      </ChildContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText("No notes for Leo yet")).toBeTruthy();
    });
    expect((screen.getByLabelText("What did you see?") as HTMLTextAreaElement).value).toBe("");
  });

  it("edits an existing journal note inline", async () => {
    vi.spyOn(journalApi, "listJournalEntries").mockResolvedValueOnce(mockNotes);
    const updateSpy = vi.spyOn(journalApi, "updateJournalEntry").mockResolvedValueOnce({
      ...mockNotes[0],
      content: "Stacked five blocks today and clapped!",
    });

    renderJournal();

    await waitFor(() => {
      expect(screen.getByText("Stacked four blocks today with giant smiles.")).toBeTruthy();
    });

    fireEvent.click(screen.getAllByRole("button", { name: /Edit note from/i })[0]);
    const editBox = screen.getByLabelText("Edit note");
    fireEvent.change(editBox, { target: { value: "Stacked five blocks today and clapped!" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        "child-1",
        "n1",
        expect.objectContaining({ content: "Stacked five blocks today and clapped!" })
      );
      expect(screen.getByText("Stacked five blocks today and clapped!")).toBeTruthy();
      expect(screen.getByText("Note updated.")).toBeTruthy();
    });
  });
});
