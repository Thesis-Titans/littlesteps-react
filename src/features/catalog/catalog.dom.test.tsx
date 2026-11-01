// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "./api";
import { CatalogBrowser } from "./components/CatalogBrowser";
import { FALLBACK_CATALOG_ACTIVITIES } from "./fallbackData";

vi.mock("../../services/firebase", () => ({ auth: {} }));

describe("CatalogBrowser DOM tests", () => {
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
      screen.getAllByText(/Source: early learning guide · still being checked/).length
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
    // HTMLDialogElement mock for jsdom
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.open = true;
    });
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
      this.open = false;
    });

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
      name: "View details for Stack the cups",
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
});
