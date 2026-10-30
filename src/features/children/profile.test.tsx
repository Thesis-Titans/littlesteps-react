import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ApiError, UnauthorizedError } from "../../services/api";
import { ChildContext } from "./context";
import { ChildForm } from "./components/ChildForm";
import { ChildGate } from "./components/ChildGate";
import { ChildrenScreen } from "./components/ChildrenScreen";
import { ChildSwitcher } from "./components/ChildSwitcher";
import { EditChildScreen } from "./components/EditChildScreen";
import { NonDiagnosticNotice } from "./components/NonDiagnosticNotice";
import { MSG, bandOptions, initialValues, mapApiError, normalizeNickname, toCreateInput, toUpdateInput, validate, yearOptions } from "./form";
import { activeChildOf, failureStatus, gateView, readActiveId, reducer, writeActiveId, type LoadState } from "./state";
import type { Child, ChildState } from "./types";

vi.mock("../../services/firebase", () => ({ auth: {} }));
vi.mock("../../components/layout", () => ({
  ScreenHeader: ({ title }: { title: string }) => <h1>{title}</h1>
}));

const NOW = new Date("2026-10-15T12:00:00Z");
const maya: Child = { id: "c1", nickname: "Maya", birthMonthYear: "2025-08", ageBand: "12-23m", createdAt: "t", updatedAt: "t" };
const liam: Child = { id: "c2", nickname: "Liam", ageBand: "48-59m", createdAt: "t", updatedAt: "t" };
const blank = { nickname: "", mode: "birth" as const, month: "", year: "", band: "" };

const state = (patch: Partial<ChildState>): ChildState => ({
  children: [], activeChild: null, status: "ready", error: null,
  setActiveChild: vi.fn(), refresh: vi.fn(), addChild: vi.fn(), editChild: vi.fn(), ...patch
});
const page = (ui: React.ReactNode, ctx: ChildState, path = "/") =>
  renderToStaticMarkup(
    <ChildContext.Provider value={ctx}>
      <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
    </ChildContext.Provider>
  );
const apiError = (status: number, details: { field: string; issue: string }[] = []) =>
  new ApiError(status, "X", "m", details);

describe("form logic", () => {
  it("normalises nicknames", () => expect(normalizeNickname("  Baby \n  Mo  ")).toBe("Baby Mo"));

  it("requires a nickname and exactly one complete age source", () => {
    expect(validate(blank, NOW)).toEqual({ nickname: MSG.nicknameMissing, age: MSG.monthMissing });
    expect(validate({ ...blank, nickname: "   ", mode: "band" }, NOW)).toEqual({ nickname: MSG.nicknameMissing, age: MSG.bandMissing });
    expect(validate({ ...blank, nickname: "x".repeat(51), mode: "band", band: "0-5m" }, NOW)).toEqual({ nickname: MSG.nicknameLong });
    expect(validate({ ...blank, nickname: "Maya", month: "8", year: "2025" }, NOW)).toEqual({});
  });

  it("rejects a future or older-than-71-months birth month, accepts the edges", () => {
    const at = (month: string, year: string) => validate({ ...blank, nickname: "M", month, year }, NOW).age;
    expect(at("11", "2026")).toBe(MSG.ageRange);
    expect(at("10", "2026")).toBeUndefined();
    expect(at("11", "2020")).toBeUndefined(); // 71 months
    expect(at("10", "2020")).toBe(MSG.ageRange); // 72 months
  });

  it("builds create input with only the chosen age source", () => {
    expect(toCreateInput({ ...blank, nickname: " Maya ", month: "8", year: "2025", band: "0-5m" })).toEqual({
      nickname: "Maya", birthMonthYear: "2025-08"
    });
    expect(toCreateInput({ ...blank, nickname: "Maya", mode: "band", band: "12-23m", month: "8", year: "2025" })).toEqual({
      nickname: "Maya", ageBand: "12-23m"
    });
  });

  it("sends only changed fields on edit, and nothing when nothing changed", () => {
    const same = initialValues(maya);
    expect(same).toMatchObject({ nickname: "Maya", mode: "birth", month: "08", year: "2025" });
    expect(toUpdateInput(same, maya)).toBeNull();
    expect(toUpdateInput({ ...same, nickname: "Mimi" }, maya)).toEqual({ nickname: "Mimi" });
    expect(toUpdateInput({ ...same, month: "7" }, maya)).toEqual({ birthMonthYear: "2025-07" });
    expect(toUpdateInput({ ...same, mode: "band", band: "12-23m" }, maya)).toEqual({ ageBand: "12-23m" });
    expect(toUpdateInput(initialValues(liam), liam)).toBeNull();
    expect(toUpdateInput({ ...initialValues(liam), mode: "birth", month: "1", year: "2022" }, liam)).toEqual({ birthMonthYear: "2022-01" });
  });

  it("offers six years and labelled bands", () => {
    expect(yearOptions(NOW)).toEqual(["2026", "2025", "2024", "2023", "2022", "2021"]);
    expect(bandOptions[2]).toEqual({ value: "12-23m", label: "12–23 months" });
  });
});

describe("ApiError to field errors", () => {
  it("maps 400 details to fields", () => {
    expect(mapApiError(apiError(400, [{ field: "nickname", issue: "x" }]))).toEqual({ nickname: MSG.nicknameMissing });
    expect(mapApiError(apiError(400, [{ field: "ageBand", issue: "x" }]))).toEqual({ age: MSG.generic });
  });
  it("maps 422 age problems to the age field", () => {
    expect(mapApiError(apiError(422, [{ field: "birthMonthYear", issue: "Must not be in the future" }]))).toEqual({ age: MSG.ageRange });
    expect(mapApiError(apiError(422))).toEqual({ form: MSG.ageRange });
  });
  it("falls back to a form message", () => {
    expect(mapApiError(apiError(400))).toEqual({ form: MSG.generic });
    expect(mapApiError(apiError(400, [{ field: "caregiverId", issue: "x" }]))).toEqual({ form: MSG.generic });
    expect(mapApiError(apiError(404))).toEqual({ form: MSG.notFound });
    expect(mapApiError(apiError(500))).toEqual({ form: MSG.notSaved });
    expect(mapApiError(new UnauthorizedError())).toEqual({ form: MSG.signedOut });
    expect(mapApiError(new TypeError("Failed to fetch"))).toEqual({ form: MSG.notSaved });
  });
});

describe("provider state", () => {
  const start: LoadState = { children: [], activeId: null, status: "loading", error: null };
  it("selects the first child when none is remembered, or when the remembered one is gone", () => {
    expect(reducer(start, { type: "loaded", children: [maya, liam] }).activeId).toBe("c1");
    expect(reducer({ ...start, activeId: "c2" }, { type: "loaded", children: [maya, liam] }).activeId).toBe("c2");
    expect(reducer({ ...start, activeId: "gone" }, { type: "loaded", children: [maya, liam] }).activeId).toBe("c1");
    expect(reducer(start, { type: "loaded", children: [] })).toMatchObject({ activeId: null, status: "ready" });
  });
  it("makes an added child active and replaces an edited one", () => {
    const ready = reducer(start, { type: "loaded", children: [maya] });
    const added = reducer(ready, { type: "added", child: liam });
    expect(added.activeId).toBe("c2");
    const edited = reducer(added, { type: "edited", child: { ...maya, nickname: "Mimi" } });
    expect(edited.children.map((c) => c.nickname)).toEqual(["Mimi", "Liam"]);
    expect(activeChildOf(edited)).toEqual(liam);
  });
  it("keeps the list when a refresh fails", () => {
    const ready = reducer(start, { type: "loaded", children: [maya] });
    const failed = reducer(ready, { type: "failed", status: "error", error: new Error("x") });
    expect(failed).toMatchObject({ status: "error", children: [maya] });
  });
  it("tells offline from API errors", () => {
    expect(failureStatus(apiError(404), false)).toBe("error");
    expect(failureStatus(apiError(500), true)).toBe("error");
    expect(failureStatus(new UnauthorizedError(), true)).toBe("error");
    expect(failureStatus(new TypeError("Failed to fetch"), true)).toBe("offline");
    expect(failureStatus(new Error("x"), false)).toBe("offline");
  });
  it("does not throw when session storage is unavailable", () => {
    expect(readActiveId("u1")).toBeNull();
    expect(() => writeActiveId("u1", "c1")).not.toThrow();
  });
  it("stores only the child id, per user", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k)
    });
    writeActiveId("u1", "c2");
    expect([...store.values()]).toEqual(["c2"]);
    expect(readActiveId("u1")).toBe("c2");
    expect(readActiveId("u2")).toBeNull();
    writeActiveId("u1", null);
    expect(store.size).toBe(0);
    vi.unstubAllGlobals();
  });
});

describe("first-run gate", () => {
  it("puts loading, errors and the first child before tab content", () => {
    expect(gateView("loading", 0)).toBe("loading");
    expect(gateView("error", 0)).toBe("error");
    expect(gateView("offline", 0)).toBe("offline");
    expect(gateView("ready", 0)).toBe("first-run");
    expect(gateView("ready", 1)).toBe("content");
    expect(gateView("loading", 1)).toBe("content");
  });
  it("renders the empty state with its action instead of the tab content", () => {
    const html = page(
      <Routes><Route element={<ChildGate />}><Route path="/" element={<p>TAB CONTENT</p>} /></Route></Routes>,
      state({})
    );
    expect(html).toContain("Add your first child");
    expect(html).toContain("<button");
    expect(html).not.toContain("TAB CONTENT");
  });
  it("shows tab content once there is a child", () => {
    const html = page(
      <Routes><Route element={<ChildGate />}><Route path="/" element={<p>TAB CONTENT</p>} /></Route></Routes>,
      state({ children: [maya], activeChild: maya })
    );
    expect(html).toContain("TAB CONTENT");
  });
});

describe("states", () => {
  const tabs = (ctx: Partial<ChildState>) =>
    page(<Routes><Route element={<ChildGate />}><Route path="/" element={<p>X</p>} /></Route></Routes>, state(ctx));
  it("loading is a skeleton announced as status", () => {
    expect(tabs({ status: "loading" })).toMatch(/role="status"[^>]*>Loading your children…/);
  });
  it("error is an alert with Retry", () => {
    const html = tabs({ status: "error" });
    expect(html).toContain('role="alert"');
    expect(html).toContain("Your saved notes are safe");
    expect(html).toContain("Retry");
  });
  it("offline is a status note that never claims a save", () => {
    const html = tabs({ status: "offline" });
    expect(html).toContain("You&#x27;re offline.");
    expect(html).toContain('role="status"');
    expect(html).not.toContain("saved");
  });
  it("editing a child that no longer exists shows the not-found state", () => {
    const html = page(
      <Routes><Route path="/children/:childId/edit" element={<EditChildScreen />} /></Routes>,
      state({ children: [maya], activeChild: maya }),
      "/children/nope/edit"
    );
    expect(html).toContain("We can&#x27;t open this profile.");
    expect(html).toContain("Your own notes are safe");
    expect(html).not.toContain("<form");
  });
  it("the list shows each child with edit links, and add", () => {
    const html = page(<ChildrenScreen />, state({ children: [maya, liam], activeChild: maya }));
    expect(html).toContain("Maya");
    expect(html).toContain("48–59 months");
    expect(html).toContain('href="/children/c2/edit"');
    expect(html).toContain("Add a child");
  });
});

describe("ChildForm markup", () => {
  const form = (child?: Child, online = true) =>
    renderToStaticMarkup(<ChildForm child={child} online={online} onSubmit={vi.fn()} />);
  it("labels every control and explains that a nickname is enough", () => {
    const html = form();
    for (const label of ["Nickname", "How would you like to share their age?", "Month", "Year", "Birth month and year"]) {
      expect(html).toContain(label);
    }
    expect(html).toContain("A nickname is enough. You don&#x27;t need a real name or an exact birth date.");
    expect(html).not.toContain("placeholder=");
    expect(html).toContain("Add child");
  });
  it("edits with the band select when the child has no birth month", () => {
    const html = form(liam);
    expect(html).toContain("Age range");
    expect(html).toContain("48–59 months");
    expect(html).toContain("Save changes");
  });
  it("disables saving offline", () => {
    const html = form(maya, false);
    expect(html).toContain("Reconnect to save changes.");
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*type="submit"|<button[^>]*type="submit"[^>]*disabled=""/);
  });
});

describe("ChildSwitcher and notice", () => {
  const switcher = (ctx: Partial<ChildState>, variant: "side" | "top" = "side") =>
    page(<ChildSwitcher variant={variant} />, state(ctx));
  it("shows the active child with a parent-friendly age as a menu button", () => {
    const html = switcher({ children: [maya, liam], activeChild: maya });
    expect(html).toContain("Maya");
    expect(html).toContain(" · 12–23 months");
    expect(html).toContain('aria-haspopup="menu"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain("Child: ");
  });
  it("offers Add a child when there are none, and nothing while loading or failed", () => {
    expect(switcher({})).toContain('href="/children?add=1"');
    expect(switcher({ status: "loading" })).toBe("");
    expect(switcher({ status: "error" })).toBe("");
  });
  it("states that it is not a diagnostic tool, in plain words", () => {
    const html = renderToStaticMarkup(<NonDiagnosticNotice />);
    expect(html).toContain("Not a diagnostic tool");
    expect(html).toContain("barangay health worker");
    expect(html).not.toMatch(/\b(delayed|behind|on track|normal|at risk)\b/);
  });
});
