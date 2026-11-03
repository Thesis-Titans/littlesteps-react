// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChildContext } from "../children/context";
import type { Child, ChildState } from "../children/types";
import * as todayApi from "../today/api";
import { ExploreScreen } from "./index";

vi.mock("../../services/firebase", () => ({ auth: {} }));
vi.mock("../today/api");
vi.mock("../catalog/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../catalog/api")>()),
  fetchCatalogActivities: vi.fn().mockRejectedValue(new Error("down"))
}));

const maya: Child = { id: "c1", nickname: "Maya", ageBand: "12-23m", createdAt: "2026-10-01", updatedAt: "2026-10-01" };
const state: ChildState = {
  children: [maya], activeChild: maya, status: "ready", error: null,
  setActiveChild: vi.fn(), refresh: vi.fn(), addChild: vi.fn(), editChild: vi.fn()
};
const renderExplore = () =>
  render(
    <ChildContext.Provider value={state}>
      <MemoryRouter><ExploreScreen /></MemoryRouter>
    </ChildContext.Provider>
  );

const realFocus = HTMLElement.prototype.focus;
// In a browser the card button could not take focus yet while the detail dialog was closing, so the plan dialog
// opened with focus on <body>. Setting this reproduces that state; jsdom alone would not.
let cardFocusBlocked = false;

beforeEach(() => {
  cardFocusBlocked = false;
  HTMLElement.prototype.focus = function (this: HTMLElement, options?: FocusOptions) {
    if (cardFocusBlocked && this.textContent?.startsWith("View activity")) return;
    realFocus.call(this, options);
  };
  // jsdom has no modal dialogs
  // Like a browser, opening a modal moves focus inside it.
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
    this.querySelector<HTMLElement>("button, input")?.focus();
  };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
afterEach(() => {
  cleanup();
  HTMLElement.prototype.focus = realFocus;
});

describe("Explore: add an activity to the plan", () => {
  it("plans from the detail view, names the child, and confirms", async () => {
    vi.mocked(todayApi.createPlan).mockResolvedValue({
      id: "p1", childId: "c1", activityId: "act-stack-cups", scheduledDate: "2026-11-05", status: "planned",
      createdAt: "2026-11-03T00:00:00Z", updatedAt: "2026-11-03T00:00:00Z"
    });
    const user = userEvent.setup();
    renderExplore();
    const open = await screen.findByRole("button", { name: "View activity for Stack the cups" });
    await user.click(open);
    await user.click(await screen.findByRole("button", { name: "Add to plan" }));
    expect(await screen.findByRole("heading", { name: "Add to Maya's plan" })).toBeTruthy();
    const date = screen.getByLabelText("Date");
    await user.clear(date);
    await user.type(date, "2026-11-05");
    await user.click(screen.getByRole("button", { name: "Add to plan" }));
    expect(todayApi.createPlan).toHaveBeenCalledWith("c1", { activityId: "act-stack-cups", scheduledDate: "2026-11-05" });
    expect(await screen.findByText("Stack the cups added to Maya's plan for Nov 5, 2026.")).toBeTruthy();
  });

  it("returns focus to the card's View activity button when the detail dialog closes", async () => {
    const user = userEvent.setup();
    renderExplore();
    const open = await screen.findByRole("button", { name: "View activity for Stack the cups" });
    await user.click(open);
    await user.click(await screen.findByRole("button", { name: "Close activity details" }));
    await waitFor(() => expect(document.activeElement).toBe(open));
  });

  it.each(["Cancel", "Escape", "Save"])("returns focus to View activity after the plan dialog closes by %s", async (how) => {
    vi.mocked(todayApi.createPlan).mockResolvedValue({
      id: "p1", childId: "c1", activityId: "act-stack-cups", scheduledDate: "2026-11-05", status: "planned",
      createdAt: "2026-11-03T00:00:00Z", updatedAt: "2026-11-03T00:00:00Z"
    });
    const user = userEvent.setup();
    renderExplore();
    const open = await screen.findByRole("button", { name: "View activity for Stack the cups" });
    await user.click(open);
    cardFocusBlocked = true;
    await user.click(await screen.findByRole("button", { name: "Add to plan" }));
    const heading = await screen.findByRole("heading", { name: "Add to Maya's plan" });
    cardFocusBlocked = false;
    // The detail dialog is gone, so the "Add to plan" button that opened this one no longer exists.
    expect(screen.queryByRole("button", { name: "Close activity details" })).toBeNull();

    if (how === "Cancel") await user.click(screen.getByRole("button", { name: "Cancel" }));
    else if (how === "Escape") fireEvent(heading.closest("dialog")!, new Event("cancel", { cancelable: true }));
    else await user.click(screen.getByRole("button", { name: "Add to plan" }));

    await waitFor(() => expect(screen.queryByRole("heading", { name: "Add to Maya's plan" })).toBeNull());
    expect(document.activeElement).toBe(open);
  });

  it("falls back to the page heading when the card button is gone", async () => {
    const user = userEvent.setup();
    renderExplore();
    const open = await screen.findByRole("button", { name: "View activity for Stack the cups" });
    await user.click(open);
    cardFocusBlocked = true;
    await user.click(await screen.findByRole("button", { name: "Add to plan" }));
    await screen.findByRole("heading", { name: "Add to Maya's plan" });
    cardFocusBlocked = false;
    open.remove(); // e.g. the list reloaded
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("heading", { name: "Explore", level: 1 })));
  });
});
