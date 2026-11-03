// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, UnauthorizedError } from "../../services/api";
import { FALLBACK_CATALOG_ACTIVITIES } from "../catalog";
import { ChildContext } from "../children/context";
import type { Child, ChildState } from "../children/types";
import * as api from "./api";
import { PlanActivityDialog } from "./components/PlanActivityDialog";
import { localDate } from "./logic";
import type { Plan } from "./types";
import { TodayScreen } from "./index";

vi.mock("../../services/firebase", () => ({ auth: {} }));
vi.mock("./api");
vi.mock("../catalog/api", () => ({ fetchCatalogActivities: vi.fn().mockRejectedValue(new Error("down")) }));

const maya: Child = { id: "c1", nickname: "Maya", ageBand: "12-23m", createdAt: "2026-10-01", updatedAt: "2026-10-01" };
const today = localDate();
const plan = (over: Partial<Plan> = {}): Plan => ({
  id: "p1", childId: "c1", activityId: "act-tummy-mirror", scheduledDate: today, status: "planned",
  createdAt: "2026-11-01T00:00:00Z", updatedAt: "2026-11-01T00:00:00Z", ...over
});
const cups = FALLBACK_CATALOG_ACTIVITIES.find((a) => a.id === "act-stack-cups")!;

const state = (): ChildState => ({
  children: [maya], activeChild: maya, status: "ready", error: null,
  setActiveChild: vi.fn(), refresh: vi.fn(), addChild: vi.fn(), editChild: vi.fn()
});
const renderToday = () =>
  render(
    <ChildContext.Provider value={state()}>
      <MemoryRouter><TodayScreen /></MemoryRouter>
    </ChildContext.Provider>
  );

/** listPlans answers by query: today's plans, then completed history. */
const stubLists = (todays: Plan[], history: Plan[] = []) =>
  vi.mocked(api.listPlans).mockImplementation(async (_id, q) => (q?.date ? todays : history));

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
});
afterEach(cleanup);

describe("Today screen", () => {
  it("shows the child's plan, the first-visit advisory, then a persistent link", async () => {
    stubLists([plan()]);
    const user = userEvent.setup();
    renderToday();
    expect(await screen.findByText("Tummy time mirror play")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Maya's plan for today" })).toBeTruthy();
    expect(api.listPlans).toHaveBeenCalledWith("c1", { date: today });
    await user.click(screen.getByRole("button", { name: "Hide this notice" }));
    expect(screen.getByRole("button", { name: "Not a diagnostic tool" })).toBeTruthy();
  });

  it("marks complete, shows the badge and undo toast, and undo restores it", async () => {
    stubLists([plan()]);
    vi.mocked(api.updatePlan).mockResolvedValueOnce(plan({ status: "completed", completedAt: "2026-11-03T10:00:00Z" }));
    const user = userEvent.setup();
    renderToday();
    await user.click(await screen.findByRole("button", { name: "Mark Tummy time mirror play complete" }));
    expect(await screen.findByText("Completed today")).toBeTruthy();
    expect(screen.getByText("Tummy time mirror play marked complete.")).toBeTruthy();
    expect(api.updatePlan).toHaveBeenCalledWith("c1", "p1", { status: "completed" });

    vi.mocked(api.updatePlan).mockResolvedValueOnce(plan());
    await user.click(screen.getByRole("button", { name: "Undo" }));
    await waitFor(() => expect(screen.queryByText("Completed today")).toBeNull());
    expect(api.updatePlan).toHaveBeenLastCalledWith("c1", "p1", { status: "planned" });
  });

  it("does not claim a save when offline", async () => {
    stubLists([plan()]);
    vi.mocked(api.updatePlan).mockRejectedValue(new TypeError("fetch failed"));
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    const user = userEvent.setup();
    renderToday();
    await user.click(await screen.findByRole("button", { name: /Mark .* complete/ }));
    expect(await screen.findByText("You're offline. This activity wasn't marked complete.")).toBeTruthy();
    expect(screen.queryByText("Completed today")).toBeNull();
    expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
    expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();
  });

  it("drops an activity that is gone (404) and keeps the rest", async () => {
    stubLists([plan(), plan({ id: "p2", activityId: "act-stack-cups" })]);
    vi.mocked(api.updatePlan).mockRejectedValue(new ApiError(404, "RESOURCE_NOT_FOUND", "gone"));
    const user = userEvent.setup();
    renderToday();
    await user.click(await screen.findByRole("button", { name: "Mark Tummy time mirror play complete" }));
    expect(await screen.findByText(/isn't available anymore/)).toBeTruthy();
    expect(screen.queryByText("Tummy time mirror play")).toBeNull();
    expect(screen.getByText(cups.title)).toBeTruthy();
  });

  it("filters the plan and offers to clear", async () => {
    stubLists([plan(), plan({ id: "p2", activityId: "act-stack-cups" })]);
    const user = userEvent.setup();
    renderToday();
    await screen.findByText(cups.title);
    await user.click(screen.getByRole("button", { name: "No materials needed" }));
    expect(screen.getByText("No planned activities match these filters.")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByText(cups.title)).toBeTruthy();
  });

  it("lists completed history", async () => {
    stubLists([], [plan({ status: "completed", completedAt: "2026-11-02T10:00:00Z", scheduledDate: "2026-11-02" })]);
    renderToday();
    expect(await screen.findByText("No activities planned for today.")).toBeTruthy();
    expect(screen.getByText(/Completed Nov 2, 2026/)).toBeTruthy();
  });

  it("shows loading, then error with Retry, offline, and unauthorized states", async () => {
    vi.mocked(api.listPlans).mockRejectedValue(new TypeError("fetch failed"));
    const user = userEvent.setup();
    renderToday();
    expect(screen.getByText("Loading Maya's plan…")).toBeTruthy();
    expect(await screen.findByText("We couldn't reach LittleSteps.")).toBeTruthy();
    cleanup();

    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    renderToday();
    expect(await screen.findByText("You're offline.")).toBeTruthy();
    stubLists([]);
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("No activities planned for today.")).toBeTruthy();
    cleanup();

    vi.mocked(api.listPlans).mockRejectedValue(new UnauthorizedError());
    renderToday();
    expect(await screen.findByText("Please sign in again.")).toBeTruthy();
  });
});

describe("PlanActivityDialog", () => {
  const open = (onPlanned = vi.fn()) => {
    // jsdom has no showModal
    HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
    render(<PlanActivityDialog activity={cups} childId="c1" childNickname="Maya" onClose={vi.fn()} onPlanned={onPlanned} />);
    return onPlanned;
  };

  it("names the child and blocks an invalid date", async () => {
    open();
    const user = userEvent.setup();
    expect(screen.getByRole("heading", { name: "Add to Maya's plan" })).toBeTruthy();
    await user.clear(screen.getByLabelText("Date"));
    await user.click(screen.getByRole("button", { name: "Add to plan" }));
    expect(screen.getByText("Choose a date.")).toBeTruthy();
    expect(api.createPlan).not.toHaveBeenCalled();
  });

  it("creates the plan with the chosen date", async () => {
    const onPlanned = open();
    vi.mocked(api.createPlan).mockResolvedValue(plan({ activityId: cups.id }));
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Add to plan" }));
    expect(api.createPlan).toHaveBeenCalledWith("c1", { activityId: cups.id, scheduledDate: today });
    await waitFor(() => expect(onPlanned).toHaveBeenCalled());
  });

  it("shows a server date error and an offline failure without success", async () => {
    const onPlanned = open();
    vi.mocked(api.createPlan).mockRejectedValueOnce(
      new ApiError(400, "INVALID_INPUT", "bad", [{ field: "scheduledDate", issue: "Must be a valid calendar date" }])
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Add to plan" }));
    expect(await screen.findByText("Must be a valid calendar date")).toBeTruthy();

    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    vi.mocked(api.createPlan).mockRejectedValueOnce(new TypeError("fetch failed"));
    await user.click(screen.getByRole("button", { name: "Add to plan" }));
    expect(await screen.findByText("You're offline. This activity wasn't added to the plan.")).toBeTruthy();
    expect(onPlanned).not.toHaveBeenCalled();
  });
});
