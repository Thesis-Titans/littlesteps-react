// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChildContext } from "../../children/context";
import type { Child, ChildState } from "../../children/types";
import { ExploreScreen } from "../index";

vi.mock("../../../services/firebase", () => ({ auth: {} }));

const mockMaya: Child = {
  id: "c1",
  nickname: "Maya",
  ageBand: "12-23m",
  createdAt: "2026-10-01",
  updatedAt: "2026-10-01",
};

function renderExplore(
  activeChild: Child | null = mockMaya,
  routeState?: { presetSetting?: "indoor" | "outdoor" | "either" }
) {
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
      <MemoryRouter initialEntries={[{ pathname: "/explore", state: routeState }]}>
        <ExploreScreen />
      </MemoryRouter>
    </ChildContext.Provider>
  );
}

describe("ExploreScreen integration", () => {
  afterEach(cleanup);

  it("renders segmented tabs, compact Idea Helper banner, and catalog browser on Activities tab", () => {
    renderExplore();

    expect(screen.getByRole("heading", { name: "Explore", level: 1 })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Activities" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: "Storybooks" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Our Bookshelf" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Read & Sing Together" })).toBeTruthy();

    expect(screen.getByRole("heading", { name: "Need a play idea?", level: 2 })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Learning activities", level: 2 })).toBeTruthy();
  });

  it("expands Idea Helper when Get a play idea is clicked and switches to top-level tabs", async () => {
    const user = userEvent.setup();
    renderExplore();

    await user.click(screen.getByRole("button", { name: "Get a play idea" }));
    expect(screen.getByRole("heading", { name: "Idea Helper", level: 2 })).toBeTruthy();
    expect(
      screen.getByText("Find a play idea for Maya with the time and materials you have.")
    ).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Hide Idea Helper" }));
    expect(screen.getByRole("heading", { name: "Need a play idea?", level: 2 })).toBeTruthy();

    await user.click(screen.getByRole("tab", { name: "Read & Sing Together" }));
    expect(screen.getByText(/Traditional Philippine Nursery Rhymes/i)).toBeTruthy();
  });

  it("auto-expands Idea Helper when opened with presetSetting route state", () => {
    renderExplore(mockMaya, { presetSetting: "indoor" });

    expect(screen.getByRole("heading", { name: "Idea Helper", level: 2 })).toBeTruthy();
  });
});
