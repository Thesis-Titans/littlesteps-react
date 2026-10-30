// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChildContext } from "./context";
import { ChildSwitcher } from "./components/ChildSwitcher";
import type { Child, ChildState } from "./types";

vi.mock("../../services/firebase", () => ({ auth: {} }));

const maya: Child = { id: "c1", nickname: "Maya", birthMonthYear: "2025-08", ageBand: "12-23m", createdAt: "t", updatedAt: "t" };
const liam: Child = { id: "c2", nickname: "Liam", ageBand: "48-59m", createdAt: "t", updatedAt: "t" };

function setup() {
  const setActiveChild = vi.fn();
  const ctx: ChildState = {
    children: [maya, liam], activeChild: maya, status: "ready", error: null,
    setActiveChild, refresh: vi.fn(), addChild: vi.fn(), editChild: vi.fn()
  };
  render(
    <ChildContext.Provider value={ctx}>
      <MemoryRouter>
        <ChildSwitcher variant="side" />
        <ChildSwitcher variant="top" />
        <button type="button">elsewhere</button>
      </MemoryRouter>
    </ChildContext.Provider>
  );
  const [first, second] = screen.getAllByRole("button", { name: /Maya/ });
  return { user: userEvent.setup(), first, second, setActiveChild };
}
const focusedName = () => document.activeElement?.textContent ?? "";
const menus = () => screen.queryAllByRole("menu");

afterEach(cleanup);

describe("ChildSwitcher interactions", () => {
  it("opens on click with focus on the active child", async () => {
    const { user, first } = setup();
    await user.click(first);
    expect(first.getAttribute("aria-expanded")).toBe("true");
    expect(menus()).toHaveLength(1);
    expect(focusedName()).toContain("Maya");
    expect(document.activeElement?.getAttribute("role")).toBe("menuitemradio");
  });

  it("opens with ArrowDown or ArrowUp on the closed trigger", async () => {
    const { user, first } = setup();
    first.focus();
    await user.keyboard("{ArrowUp}");
    expect(menus()).toHaveLength(1);
  });

  it("moves with ArrowDown, ArrowUp, Home and End and wraps at both ends", async () => {
    const { user, first } = setup();
    await user.click(first); // Maya
    await user.keyboard("{ArrowDown}");
    expect(focusedName()).toContain("Liam");
    await user.keyboard("{ArrowDown}");
    expect(focusedName()).toBe("Add a child");
    await user.keyboard("{End}");
    expect(focusedName()).toBe("Manage children");
    await user.keyboard("{ArrowDown}"); // wraps to the first
    expect(focusedName()).toContain("Maya");
    await user.keyboard("{ArrowUp}"); // wraps to the last
    expect(focusedName()).toBe("Manage children");
    await user.keyboard("{Home}");
    expect(focusedName()).toContain("Maya");
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const { user, first } = setup();
    await user.click(first);
    await user.keyboard("{Escape}");
    expect(menus()).toHaveLength(0);
    expect(document.activeElement).toBe(first);
  });

  it("closes on Tab and keeps focus on the trigger so it is not lost", async () => {
    const { user, first } = setup();
    await user.click(first);
    fireEvent.keyDown(document.activeElement!, { key: "Tab" });
    expect(menus()).toHaveLength(0);
    expect(document.activeElement).toBe(first);
  });

  it("closes on a pointer press outside, but not inside", async () => {
    const { user, first } = setup();
    await user.click(first);
    await user.pointer({ keys: "[MouseLeft>]", target: screen.getByRole("menu") });
    expect(menus()).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "elsewhere" }));
    expect(menus()).toHaveLength(0);
  });

  it("keeps one menu open at a time", async () => {
    const { user, first, second } = setup();
    await user.click(first);
    second.focus(); // keyboard route, so the outside-press rule is not what closes the first
    await user.keyboard("{ArrowDown}");
    expect(menus()).toHaveLength(1);
    expect(first.getAttribute("aria-expanded")).toBe("false");
    expect(second.getAttribute("aria-expanded")).toBe("true");
  });

  it("selects a child, closes and returns focus to the trigger", async () => {
    const { user, first, setActiveChild } = setup();
    await user.click(first);
    await user.click(screen.getByRole("menuitemradio", { name: /Liam/ }));
    expect(setActiveChild).toHaveBeenCalledWith(liam);
    expect(menus()).toHaveLength(0);
    expect(document.activeElement).toBe(first);
  });
});
