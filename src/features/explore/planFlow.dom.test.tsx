// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
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

beforeEach(() => {
  // jsdom has no modal dialogs
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
afterEach(cleanup);

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

  it("returns focus to the control that opened each dialog", async () => {
    const user = userEvent.setup();
    renderExplore();
    const open = await screen.findByRole("button", { name: "View activity for Stack the cups" });
    await user.click(open);
    await user.click(await screen.findByRole("button", { name: "Close activity details" }));
    await waitFor(() => expect(document.activeElement).toBe(open));

    await user.click(open);
    await user.click(await screen.findByRole("button", { name: "Add to plan" }));
    await user.click(await screen.findByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(document.activeElement).toBe(open));
  });
});
