import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getWeeklySummary } from "./api";

const mockAuth = vi.hoisted(() => ({
  currentUser: { getIdToken: async () => "mock-token" }
}));
vi.mock("../../services/firebase", () => ({ auth: mockAuth }));

describe("this-week API client", () => {
  const originalEnv = import.meta.env.VITE_API_BASE_URL;

  beforeEach(() => {
    vi.restoreAllMocks();
    import.meta.env.VITE_API_BASE_URL = "https://api.littlesteps.local";
  });

  afterEach(() => {
    import.meta.env.VITE_API_BASE_URL = originalEnv;
  });

  it("fetches weekly summary for child without startDate", async () => {
    const mockSummary = {
      id: "2026-W45",
      weekStartDate: "2026-11-02",
      weekEndDate: "2026-11-08",
      completedActivityCount: 4,
      observedMilestoneCount: 2,
      totalPlannedActivities: 5,
      domainDistribution: {
        cognitive: 2,
        motor: 1,
        language: 1,
        socioEmotional: 0
      },
      topActivityIds: ["act-peekaboo", "act-blocks"],
      reflectionPrompt: "You observed consistent motor development through everyday shared play.",
      generatedAt: "2026-11-08T10:00:00Z"
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockSummary
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await getWeeklySummary("child-1");
    expect(result).toEqual(mockSummary);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.littlesteps.local/api/v1/children/child-1/summary/weekly",
      expect.objectContaining({ cache: "no-store" })
    );
  });

  it("fetches weekly summary with custom startDate query", async () => {
    const mockSummary = {
      id: "2026-W44",
      weekStartDate: "2026-10-26",
      weekEndDate: "2026-11-01",
      completedActivityCount: 3,
      observedMilestoneCount: 1,
      totalPlannedActivities: 4,
      domainDistribution: {
        cognitive: 1,
        motor: 1,
        language: 1,
        socioEmotional: 0
      },
      topActivityIds: ["act-music"],
      reflectionPrompt: "Shared sensory play supported engagement this week.",
      generatedAt: "2026-11-01T10:00:00Z"
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockSummary
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await getWeeklySummary("child-1", { startDate: "2026-10-26" });
    expect(result).toEqual(mockSummary);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.littlesteps.local/api/v1/children/child-1/summary/weekly?startDate=2026-10-26",
      expect.anything()
    );
  });
});

