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
    await user.click(await screen.findByRole("button", { name: "Mark complete for Tummy time mirror play" }));
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
    await user.click(await screen.findByRole("button", { name: /Mark complete/ }));
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
    await user.click(await screen.findByRole("button", { name: "Mark complete for Tummy time mirror play" }));
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
    expect(await screen.findByText("Please sign in again to continue")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
  });
});

describe("Today screen follow-ups", () => {
  const completed = (over: Partial<Plan> = {}) => plan({ status: "completed", completedAt: "2026-11-03T10:00:00Z", ...over });

  it("moves focus to Undo after marking complete", async () => {
    stubLists([plan()]);
    vi.mocked(api.updatePlan).mockResolvedValue(completed());
    const user = userEvent.setup();
    renderToday();
    await user.click(await screen.findByRole("button", { name: /Mark complete/ }));
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: "Undo" })));
  });

  it("keeps the toast and offers Retry when undo fails", async () => {
    stubLists([plan()]);
    vi.mocked(api.updatePlan).mockResolvedValueOnce(completed());
    const user = userEvent.setup();
    renderToday();
    await user.click(await screen.findByRole("button", { name: /Mark complete/ }));
    vi.mocked(api.updatePlan).mockRejectedValueOnce(new TypeError("fetch failed"));
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    await user.click(await screen.findByRole("button", { name: "Undo" }));
    expect(await screen.findByText("You're offline. This activity wasn't changed back to planned.")).toBeTruthy();
    expect(screen.getByText("Completed today")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Undo" })).toBeTruthy();

    vi.mocked(api.updatePlan).mockResolvedValueOnce(plan());
    await user.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(screen.queryByText("Completed today")).toBeNull());
  });

  it("tracks busy per plan and keeps the first toast until the second completes", async () => {
    stubLists([plan(), plan({ id: "p2", activityId: "act-stack-cups" })]);
    let finishSecond!: (p: Plan) => void;
    vi.mocked(api.updatePlan)
      .mockResolvedValueOnce(completed())
      .mockImplementationOnce(() => new Promise<Plan>((resolve) => { finishSecond = resolve; }));
    const user = userEvent.setup();
    renderToday();
    await user.click(await screen.findByRole("button", { name: "Mark complete for Tummy time mirror play" }));
    expect(await screen.findByText("Tummy time mirror play marked complete.")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: `Mark complete for ${cups.title}` }));
    expect(screen.getByText("Tummy time mirror play marked complete.")).toBeTruthy();
    expect((screen.getByRole("button", { name: `Mark complete for ${cups.title}` }) as HTMLButtonElement).disabled).toBe(true);
    finishSecond(completed({ id: "p2", activityId: cups.id }));
    expect(await screen.findByText(`${cups.title} marked complete.`)).toBeTruthy();
  });

  it("shows the completion day in local time and a note when history is cut", async () => {
    const history = Array.from({ length: 100 }, (_, i) =>
      completed({ id: `h${i}`, scheduledDate: "2026-10-30", completedAt: "2026-11-02T12:00:00Z" })
    );
    stubLists([], history);
    renderToday();
    expect((await screen.findAllByText(/Completed Nov 2, 2026/)).length).toBe(100);
    expect(screen.getByText(/shows the first 100 completed activities/)).toBeTruthy();
  });

  it("treats Under 10 mins as 10 minutes or less", async () => {
    stubLists([plan(), plan({ id: "p2", activityId: "act-stack-cups" })]);
    const user = userEvent.setup();
    renderToday();
    await screen.findByText("Tummy time mirror play");
    await user.click(screen.getByRole("button", { name: "Under 10 mins" }));
    expect(screen.getByText("Tummy time mirror play")).toBeTruthy(); // 10 minutes counts
    expect(screen.queryByText(cups.title)).toBeNull(); // 15 minutes does not
  });

  it("keeps the newer toast when an earlier undo resolves", async () => {
    stubLists([plan(), plan({ id: "p2", activityId: "act-stack-cups" })]);
    let finishUndo!: (p: Plan) => void;
    vi.mocked(api.updatePlan)
      .mockResolvedValueOnce(completed())
      .mockImplementationOnce(() => new Promise<Plan>((resolve) => { finishUndo = resolve; }))
      .mockResolvedValueOnce(completed({ id: "p2", activityId: cups.id }));
    const user = userEvent.setup();
    renderToday();
    await user.click(await screen.findByRole("button", { name: "Mark complete for Tummy time mirror play" }));
    await user.click(await screen.findByRole("button", { name: "Undo" }));
    await user.click(screen.getByRole("button", { name: `Mark complete for ${cups.title}` }));
    expect(await screen.findByText(`${cups.title} marked complete.`)).toBeTruthy();
    finishUndo(plan());
    await waitFor(() => expect(screen.getAllByRole("button", { name: /Mark complete for Tummy/ }).length).toBe(1));
    expect(screen.getByText(`${cups.title} marked complete.`)).toBeTruthy();
  });

  it("does not pull focus from a control the user moved to", async () => {
    stubLists([plan()]);
    let finish!: (p: Plan) => void;
    vi.mocked(api.updatePlan).mockImplementation(() => new Promise<Plan>((resolve) => { finish = resolve; }));
    const user = userEvent.setup();
    renderToday();
    await user.click(await screen.findByRole("button", { name: /Mark complete/ }));
    const chip = screen.getByRole("button", { name: "Indoor" });
    chip.focus();
    finish(completed());
    await screen.findByText("Tummy time mirror play marked complete.");
    expect(document.activeElement).toBe(chip);
  });

  it("reloads for the new day when the tab regains focus after midnight", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      vi.setSystemTime(new Date(2026, 10, 3, 23, 50));
      stubLists([plan()]);
      renderToday();
      await screen.findByText("Tummy time mirror play");
      expect(api.listPlans).toHaveBeenCalledWith("c1", { date: "2026-11-03" });
      vi.setSystemTime(new Date(2026, 10, 4, 0, 10));
      window.dispatchEvent(new Event("focus"));
      await waitFor(() => expect(api.listPlans).toHaveBeenCalledWith("c1", { date: "2026-11-04" }));
    } finally {
      vi.useRealTimers();
    }
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

  it("renders hero greeting and Figma sidebar widgets", async () => {
    stubLists([]);
    renderToday();

    expect(await screen.findByText(/Good (morning|afternoon|evening)!/i)).toBeTruthy();
    expect(screen.getByText(/Here's Maya's play plan for today/i)).toBeTruthy();

    // Side widgets (react #45)
    expect(screen.getByRole("heading", { name: "Need a quick idea?" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "This week" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Milestones to notice" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Find an idea" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "View reflection" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "View milestones" })).toBeTruthy();
  });
});
