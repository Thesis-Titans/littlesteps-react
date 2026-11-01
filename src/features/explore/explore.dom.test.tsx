// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChildContext } from "../children/context";
import type { Child, ChildState } from "../children/types";
import { ExploreScreen } from "./index";

vi.mock("../../services/firebase", () => ({ auth: {} }));

const mockMaya: Child = {
  id: "c1",
  nickname: "Maya",
  ageBand: "12-23m",
  createdAt: "2026-10-01",
  updatedAt: "2026-10-01",
};

function renderExplore(activeChild: Child | null = mockMaya) {
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
        <ExploreScreen />
      </MemoryRouter>
    </ChildContext.Provider>
  );
}

describe("ExploreScreen integration", () => {
  afterEach(cleanup);

  it("renders screen header, idea helper, and catalog browser", () => {
    renderExplore();

    expect(screen.getByRole("heading", { name: "Explore", level: 1 })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Idea helper", level: 2 })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Learning activities", level: 2 })
    ).toBeTruthy();
  });

  it("passes active child's age band and nickname to child components", () => {
    renderExplore();

    expect(
      screen.getByText("Find a personalized play idea for Maya in seconds.")
    ).toBeTruthy();
  });
});
