// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../services/api";
import { ChildContext } from "./context";
import { ChildrenScreen } from "./components/ChildrenScreen";
import { EditChildScreen } from "./components/EditChildScreen";
import { MSG, bandOptions } from "./form";
import type { Child, ChildState } from "./types";

vi.mock("../../services/firebase", () => ({ auth: {} }));
vi.mock("../../components/layout", () => ({
  ScreenHeader: ({ title }: { title: string }) => <h1 tabIndex={-1}>{title}</h1>
}));

const maya: Child = { id: "c1", nickname: "Maya", birthMonthYear: "2025-08", ageBand: "12-23m", createdAt: "t", updatedAt: "t" };
const many = (n: number): Child[] => Array.from({ length: n }, (_, i) => ({ ...maya, id: `k${i}`, nickname: `Kid${i}` }));

function setup(path: string, children: Child[], patch: Partial<ChildState> = {}) {
  const ctx: ChildState = {
    children, activeChild: children[0] ?? null, status: "ready", error: null,
    setActiveChild: vi.fn(), refresh: vi.fn().mockResolvedValue(undefined),
    addChild: vi.fn(), editChild: vi.fn(), ...patch
  };
  render(
    <ChildContext.Provider value={ctx}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/children" element={<ChildrenScreen />} />
          <Route path="/children/:childId/edit" element={<EditChildScreen />} />
        </Routes>
      </MemoryRouter>
    </ChildContext.Provider>
  );
  return { ctx, user: userEvent.setup() };
}

afterEach(cleanup);

describe("child form through the real screens", () => {
  it("shows errors and focuses the nickname when submitted empty", async () => {
    const { user, ctx } = setup("/children?add=1", [maya]);
    await user.click(screen.getByRole("button", { name: "Add child" }));
    expect(screen.getByText(MSG.nicknameMissing)).toBeTruthy();
    expect(screen.getByText(MSG.monthMissing)).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText("Nickname")));
    expect(ctx.addChild).not.toHaveBeenCalled();
  });

  it("explains a hidden character in the nickname", async () => {
    const { user } = setup("/children?add=1", [maya]);
    await user.type(screen.getByLabelText("Nickname"), "Ma​ya");
    await user.click(screen.getByRole("button", { name: "Add child" }));
    expect(screen.getByText(MSG.nicknameHidden)).toBeTruthy();
  });

  it("sends only the nickname when an edit renames the child", async () => {
    const editChild = vi.fn().mockResolvedValue({ ...maya, nickname: "Mia" });
    const { user } = setup("/children/c1/edit", [maya], { editChild });
    const nickname = screen.getByLabelText("Nickname");
    await user.clear(nickname);
    await user.type(nickname, "Mia");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(editChild).toHaveBeenCalledOnce();
    expect(editChild).toHaveBeenCalledWith("c1", { nickname: "Mia" });
  });

  it("replaces the add actions with the limit note at 20 children", () => {
    setup("/children", many(20));
    expect(screen.getByText(MSG.limitNote)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Add a child" })).toBeNull();
  });

  it("shows the limit note instead of the form when ?add=1 is opened at the limit", () => {
    setup("/children?add=1", many(20));
    expect(screen.getByText(MSG.limitNote)).toBeTruthy();
    expect(screen.queryByLabelText("Nickname")).toBeNull();
  });

  it("maps a 422 limit error to the form alert and refreshes the list", async () => {
    const addChild = vi.fn().mockRejectedValue(new ApiError(422, "VALIDATION", "m", [{ field: "children", issue: "limit" }]));
    const { user, ctx } = setup("/children?add=1", [maya], { addChild });
    await user.type(screen.getByLabelText("Nickname"), "Noah");
    await user.selectOptions(screen.getByLabelText("How would you like to share their age?"), "band");
    await user.selectOptions(screen.getByLabelText("Age range"), bandOptions[0].value);
    await user.click(screen.getByRole("button", { name: "Add child" }));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain(MSG.limit);
    expect(ctx.refresh).toHaveBeenCalledOnce();
    await waitFor(() => expect(document.activeElement).toBe(alert));
  });
});
