// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChildContext } from "../children/context";
import type { Child, ChildState } from "../children/types";
import { ThisWeekScreen } from "./ThisWeekScreen";
import * as thisWeekApi from "./api";

const mockMaya: Child = {
  id: "child-1",
  nickname: "Maya",
  ageBand: "12-23m",
  createdAt: "2026-10-01",
  updatedAt: "2026-10-01",
};

const mockSummary = {
  id: "2026-W46",
  weekStartDate: "2026-11-09",
  weekEndDate: "2026-11-15",
  completedActivityCount: 3,
  observedMilestoneCount: 1,
  totalPlannedActivities: 4,
  domainDistribution: {
    cognitive: 2,
    motor: 1,
    language: 0,
    socioEmotional: 0,
  },
  topActivityIds: ["act-1"],
  reflectionPrompt: "Shared sensory play and stacking supported exploration this week.",
  generatedAt: "2026-11-15T18:00:00Z",
};

function renderThisWeek(activeChild: Child | null = mockMaya) {
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
        <ThisWeekScreen />
      </MemoryRouter>
    </ChildContext.Provider>
  );
}

describe("ThisWeekScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders weekly summary stats and domain breakdown", async () => {
    vi.spyOn(thisWeekApi, "getWeeklySummary").mockResolvedValueOnce(mockSummary);

    renderThisWeek();

    expect(screen.getByRole("heading", { name: "This week", level: 1 })).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Week navigation" })).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText("3")).toBeTruthy();
      expect(screen.getByText("Completed activities")).toBeTruthy();
      expect(screen.getByText("1")).toBeTruthy();
      expect(screen.getByText("Milestones noticed")).toBeTruthy();
    });

    // Domain distributions
    expect(screen.getByText("Thinking")).toBeTruthy();
    expect(screen.getByText("2 activities")).toBeTruthy();
    expect(screen.getByText("Moving")).toBeTruthy();
    expect(screen.getByText("1 activity")).toBeTruthy();
    expect(screen.getByText("Talking")).toBeTruthy();
    expect(screen.getAllByText("None this week").length).toBe(2);

    // Non-diagnostic reflection card
    expect(screen.getByText("Reflections on your week")).toBeTruthy();
    expect(screen.getByText(/Shared sensory play and stacking supported exploration this week/i)).toBeTruthy();
    expect(screen.getByText(/It's not a test/i)).toBeTruthy();
  });

  it("navigates to previous week and queries summary", async () => {
    const summarySpy = vi.spyOn(thisWeekApi, "getWeeklySummary")
      .mockResolvedValueOnce(mockSummary)
      .mockResolvedValueOnce({
        ...mockSummary,
        id: "2026-W45",
        completedActivityCount: 5,
      });

    renderThisWeek();

    await waitFor(() => {
      expect(screen.getByText("Completed activities")).toBeTruthy();
    });

    const prevBtn = screen.getByRole("button", { name: "Previous week" });
    fireEvent.click(prevBtn);

    await waitFor(() => {
      expect(summarySpy).toHaveBeenCalledTimes(2);
    });
  });

  it("renders guilt-free empty state when no activities recorded", async () => {
    vi.spyOn(thisWeekApi, "getWeeklySummary").mockResolvedValueOnce({
      ...mockSummary,
      completedActivityCount: 0,
      observedMilestoneCount: 0,
      domainDistribution: {
        cognitive: 0,
        motor: 0,
        language: 0,
        socioEmotional: 0,
      },
    });

    renderThisWeek();

    await waitFor(() => {
      expect(screen.getByText("No activities recorded this week.")).toBeTruthy();
      expect(screen.getByText("Every week is different. There are no tests or catch-up lists.")).toBeTruthy();
    });
  });
});
