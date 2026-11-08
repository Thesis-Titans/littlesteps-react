import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createJournalEntry,
  deleteJournalEntry,
  getJournalEntry,
  listJournalEntries,
  updateJournalEntry
} from "./api";

const mockAuth = vi.hoisted(() => ({
  currentUser: { getIdToken: async () => "mock-token" }
}));
vi.mock("../../services/firebase", () => ({ auth: mockAuth }));

describe("journal API client", () => {
  const originalEnv = import.meta.env.VITE_API_BASE_URL;

  beforeEach(() => {
    vi.restoreAllMocks();
    import.meta.env.VITE_API_BASE_URL = "https://api.littlesteps.local";
  });

  afterEach(() => {
    import.meta.env.VITE_API_BASE_URL = originalEnv;
  });

  it("lists journal entries for child", async () => {
    const mockEntries = [
      {
        id: "entry-1",
        childId: "child-1",
        entryDate: "2026-11-08",
        content: "Built block towers today.",
        createdAt: "2026-11-08T10:00:00Z",
        updatedAt: "2026-11-08T10:00:00Z"
      }
    ];

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockEntries
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await listJournalEntries("child-1", { date: "2026-11-08" });
    expect(result).toEqual(mockEntries);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.littlesteps.local/api/v1/children/child-1/journal?date=2026-11-08",
      expect.objectContaining({ cache: "no-store" })
    );
  });

  it("gets single journal entry", async () => {
    const mockEntry = {
      id: "entry-1",
      childId: "child-1",
      entryDate: "2026-11-08",
      content: "First steps observed.",
      createdAt: "2026-11-08T10:00:00Z",
      updatedAt: "2026-11-08T10:00:00Z"
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockEntry
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await getJournalEntry("child-1", "entry-1");
    expect(result).toEqual(mockEntry);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.littlesteps.local/api/v1/children/child-1/journal/entry-1",
      expect.anything()
    );
  });

  it("creates journal entry with JSON body", async () => {
    const input = {
      content: "Enjoyed sensory play with water cups.",
      entryDate: "2026-11-08"
    };
    const created = {
      id: "entry-new",
      childId: "child-1",
      ...input,
      createdAt: "2026-11-08T10:00:00Z",
      updatedAt: "2026-11-08T10:00:00Z"
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => created
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await createJournalEntry("child-1", input);
    expect(result).toEqual(created);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.littlesteps.local/api/v1/children/child-1/journal",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(input)
      })
    );
  });

  it("updates journal entry", async () => {
    const input = { content: "Updated reflection text." };
    const updated = {
      id: "entry-1",
      childId: "child-1",
      entryDate: "2026-11-08",
      content: "Updated reflection text.",
      createdAt: "2026-11-08T10:00:00Z",
      updatedAt: "2026-11-08T11:00:00Z"
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => updated
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await updateJournalEntry("child-1", "entry-1", input);
    expect(result).toEqual(updated);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.littlesteps.local/api/v1/children/child-1/journal/entry-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify(input)
      })
    );
  });

  it("deletes journal entry", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => ({})
    });
    vi.stubGlobal("fetch", fetchMock);

    await deleteJournalEntry("child-1", "entry-1");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.littlesteps.local/api/v1/children/child-1/journal/entry-1",
      expect.objectContaining({
        method: "DELETE"
      })
    );
  });
});

