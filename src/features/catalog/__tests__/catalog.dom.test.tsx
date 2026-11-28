// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SOURCE_ATTRIBUTION } from "../../../config/externalLinks";
import { UnauthorizedError } from "../../../services/api";
import { installDialogPolyfill } from "../../../test/dialogPolyfill";
import * as aiApi from "../../ai/api";
import * as api from "../api";
import { CatalogBrowser } from "../components/CatalogBrowser";
import { FALLBACK_CATALOG_ACTIVITIES } from "../fallbackData";

vi.mock("../../../services/firebase", () => ({ auth: {} }));

describe("CatalogBrowser DOM tests", () => {
  installDialogPolyfill();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(cleanup);

  it("renders activities from the API when available", async () => {
    vi.spyOn(api, "fetchCatalogActivities").mockResolvedValue({
      total: 2,
      items: [
        FALLBACK_CATALOG_ACTIVITIES[0],
        FALLBACK_CATALOG_ACTIVITIES[1],
      ],
    });

    render(<CatalogBrowser />);

    // Screen reader loading skeleton announcement
    expect(screen.getAllByText("Loading activities").length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(screen.getByText("Tummy time mirror play")).toBeTruthy();
      expect(screen.getByText("Gentle rattle tracking")).toBeTruthy();
    });

    // Check source line attribution
    expect(
      screen.getAllByText(DEFAULT_SOURCE_ATTRIBUTION).length
    ).toBeGreaterThan(0);
  });

  it("falls back cleanly to curated activities when API returns empty", async () => {
    vi.spyOn(api, "fetchCatalogActivities").mockResolvedValue({
      total: 0,
      items: [],
    });

    render(<CatalogBrowser initialAgeBand="12-23m" />);

    await waitFor(() => {
      expect(screen.getByText("Showing saved activities")).toBeTruthy();
      expect(screen.getByText("Stack the cups")).toBeTruthy();
    });
  });

  it("filters activities when selecting a domain chip", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "fetchCatalogActivities").mockResolvedValue({
      total: FALLBACK_CATALOG_ACTIVITIES.length,
      items: FALLBACK_CATALOG_ACTIVITIES,
    });

    render(<CatalogBrowser />);

    await waitFor(() => {
      expect(screen.getByText("Tummy time mirror play")).toBeTruthy();
    });

    // Click "Moving" domain chip
    const movingChip = screen.getByRole("button", { name: "Moving" });
    await user.click(movingChip);

    expect(movingChip.getAttribute("aria-pressed")).toBe("true");
  });

  it("filters activities by search query", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "fetchCatalogActivities").mockResolvedValue({
      total: FALLBACK_CATALOG_ACTIVITIES.length,
      items: FALLBACK_CATALOG_ACTIVITIES,
    });

    render(<CatalogBrowser />);

    await waitFor(() => {
      expect(screen.getByText("Stack the cups")).toBeTruthy();
    });

    const searchInput = screen.getByLabelText("Search activities");
    await user.type(searchInput, "cups");

    expect(screen.getByText("Stack the cups")).toBeTruthy();
    expect(screen.queryByText("Tummy time mirror play")).toBeNull();
  });

  it("displays empty state and allows clearing filters", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "fetchCatalogActivities").mockResolvedValue({
      total: FALLBACK_CATALOG_ACTIVITIES.length,
      items: FALLBACK_CATALOG_ACTIVITIES,
    });

    render(<CatalogBrowser />);

    await waitFor(() => {
      expect(screen.getByText("Stack the cups")).toBeTruthy();
    });

    const searchInput = screen.getByLabelText("Search activities");
    await user.type(searchInput, "nonexistentquery12345");

    await waitFor(() => {
      expect(screen.getByText("No activities match these filters")).toBeTruthy();
    });

    const clearButton = screen.getByRole("button", { name: "Clear filters" });
    await user.click(clearButton);

    await waitFor(() => {
      expect(screen.getByText("Stack the cups")).toBeTruthy();
    });
  });

  it("opens and closes the activity detail modal", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "fetchCatalogActivities").mockResolvedValue({
      total: 1,
      items: [FALLBACK_CATALOG_ACTIVITIES[4]], // Stack the cups
    });

    render(<CatalogBrowser />);

    await waitFor(() => {
      expect(screen.getByText("Stack the cups")).toBeTruthy();
    });

    const viewButton = screen.getByRole("button", {
      name: "View activity for Stack the cups",
    });
    await user.click(viewButton);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeTruthy();
      expect(screen.getByText("Steps to play")).toBeTruthy();
      expect(screen.getByText("Materials needed")).toBeTruthy();
      expect(screen.getByText("Good to remember")).toBeTruthy();
    });

    const closeButton = screen.getByRole("button", { name: "Close" });
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("handles catastrophic error by showing alert with Retry", async () => {
    vi.spyOn(api, "fetchCatalogActivities").mockRejectedValue(new Error("Network failed"));
    vi.spyOn(api, "filterFallbackActivities").mockReturnValue({
      total: 0,
      items: [],
    });

    render(<CatalogBrowser />);

    await waitFor(() => {
      expect(screen.getByText("The activity list didn't load")).toBeTruthy();
      expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();
    });
  });

  it("shows Please sign in again to continue with no Retry when unauthorized", async () => {
    vi.spyOn(api, "fetchCatalogActivities").mockRejectedValue(new UnauthorizedError());

    render(<CatalogBrowser />);

    await waitFor(() => {
      expect(screen.getByText("Please sign in again to continue")).toBeTruthy();
      expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
    });
  });

  it("adapts an activity and allows adding adapted activity to plan", async () => {
    const user = userEvent.setup();
    const onPlanMock = vi.fn();
    const fakeAdaptResponse = {
      source: "ai" as const,
      tier: 1 as const,
      adapted: {
        activityId: "act-stack-cups",
        originalTitle: "Stack the cups",
        adaptedTitle: "Quick cup stacking (5 min)",
        adjustment: "shorter" as const,
        durationMinutes: 5,
        materials: ["plastic cups"],
        instructions: [
          "Place two cups on the floor.",
          "Show how to stack one on top and gently tap it.",
        ],
        explanation: "Keeps attention high for a quick 5-minute playful connection.",
        safetyNotice: "Stay close to ensure plastic cups don't have sharp edges.",
      },
      provenance: {
        badge: "Suggested by AI" as const,
        model: "gemini-3.8-flash",
        disclaimer: "Observational play suggestion only. Not developmental assessment.",
      },
    };

    vi.spyOn(api, "fetchCatalogActivities").mockResolvedValue({
      total: 1,
      items: [FALLBACK_CATALOG_ACTIVITIES[4]], // Stack the cups
    });

    vi.spyOn(aiApi, "adaptActivity").mockResolvedValue(fakeAdaptResponse);

    render(<CatalogBrowser onPlan={onPlanMock} childAgeMonths={18} />);

    await waitFor(() => {
      expect(screen.getByText("Stack the cups")).toBeTruthy();
    });

    // Open activity details
    const viewButton = screen.getByRole("button", {
      name: "View activity for Stack the cups",
    });
    await user.click(viewButton);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Adapt this activity" })).toBeTruthy();
    });

    // Click Adapt activity to expand the form
    await user.click(screen.getByRole("button", { name: "Adapt this activity" }));

    // Select Shorter
    await user.click(screen.getByLabelText("Shorter (5–10 min)"));

    // Click Adjust activity
    await user.click(screen.getByRole("button", { name: "Adjust activity" }));

    await waitFor(() => {
      expect(screen.getByText("Quick cup stacking (5 min)")).toBeTruthy();
      expect(screen.getByText("Suggested by AI")).toBeTruthy();
      expect(
        screen.getByText("Keeps attention high for a quick 5-minute playful connection.")
      ).toBeTruthy();
      expect(screen.getByText("Place two cups on the floor.")).toBeTruthy();
      expect(
        screen.getByRole("button", { name: "Add adapted activity to plan" })
      ).toBeTruthy();
    });

    // Add adapted activity to plan
    await user.click(screen.getByRole("button", { name: "Add adapted activity to plan" }));

    expect(onPlanMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Quick cup stacking (5 min)",
        durationMinutes: 5,
        instructions: [
          "Place two cups on the floor.",
          "Show how to stack one on top and gently tap it.",
        ],
      }),
      expect.anything()
    );
  });
});
