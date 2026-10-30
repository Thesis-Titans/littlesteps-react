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
import { addedMessage, keepNoticeOn, noticeFor, noticeState, readNotice, savedMessage } from "./notice";
import { InlineAlert, SuccessNotice, TextField } from "../../components/common";
import { keyOpensMenu, initialIndex, menuAction } from "./components/menuKeys";
import { MSG, ageChanged, bandOptions, birthOutOfRange, initialValues, mapApiError, normalizeNickname, prepareSubmit, toCreateInput, toUpdateInput, validate, validateForm, yearOptions } from "./form";
import { activeChildOf, failureStatus, gateView, initialState, onOnline, readActiveId, reducer, writeActiveId } from "./state";
import type { Child, ChildState } from "./types";

vi.mock("../../services/firebase", () => ({ auth: {} }));
vi.mock("../../components/layout", () => ({
  ScreenHeader: ({ title }: { title: string }) => <h1>{title}</h1>
}));

const NOW = new Date("2026-10-15T12:00:00Z");
const maya: Child = { id: "c1", nickname: "Maya", birthMonthYear: "2025-08", ageBand: "12-23m", createdAt: "t", updatedAt: "t" };
const liam: Child = { id: "c2", nickname: "Liam", ageBand: "48-59m", createdAt: "t", updatedAt: "t" };
const old: Child = { id: "c3", nickname: "Old", birthMonthYear: "2019-03", ageBand: "60-71m", createdAt: "t", updatedAt: "t" };
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
  const start = initialState("u1", null);
  const load = (children: Child[], userId = "u1") => ({ type: "loaded", userId, children }) as const;
  it("selects the first child when none is remembered, or when the remembered one is gone", () => {
    expect(reducer(start, load([maya, liam])).activeId).toBe("c1");
    expect(reducer({ ...start, activeId: "c2" }, load([maya, liam])).activeId).toBe("c2");
    expect(reducer({ ...start, activeId: "gone" }, load([maya, liam])).activeId).toBe("c1");
    expect(reducer(start, load([]))).toMatchObject({ activeId: null, status: "ready" });
  });
  it("makes an added child active and replaces an edited one", () => {
    const ready = reducer(start, load([maya]));
    const added = reducer(ready, { type: "added", child: liam });
    expect(added.activeId).toBe("c2");
    const edited = reducer(added, { type: "edited", child: { ...maya, nickname: "Mimi" } });
    expect(edited.children.map((c) => c.nickname)).toEqual(["Mimi", "Liam"]);
    expect(activeChildOf(edited)).toEqual(liam);
  });
  it("keeps the list when a refresh fails", () => {
    const ready = reducer(start, load([maya]));
    const failed = reducer(ready, { type: "failed", userId: "u1", status: "error", error: new Error("x") });
    expect(failed).toMatchObject({ status: "error", children: [maya] });
  });
  it("is offline only when the browser is offline; other failures are errors; 401 is its own state", () => {
    expect(failureStatus(new TypeError("Failed to fetch"), false)).toBe("offline");
    expect(failureStatus(apiError(500), false)).toBe("offline");
    expect(failureStatus(new TypeError("Failed to fetch"), true)).toBe("error");
    expect(failureStatus(apiError(404), true)).toBe("error");
    expect(failureStatus(apiError(500), true)).toBe("error");
    expect(failureStatus(new UnauthorizedError(), true)).toBe("unauthorized");
    expect(failureStatus(apiError(401), true)).toBe("unauthorized");
  });
  it("keeps a child added while the list was loading", () => {
    const loading = reducer(start, { type: "loading" });
    const added = reducer(loading, { type: "added", child: liam });
    const done = reducer(added, load([maya])); // answer from before the add
    expect(done.children.map((c) => c.id)).toEqual(["c1", "c2"]);
    expect(done.activeId).toBe("c2");
    expect(done.status).toBe("ready");
  });
  it("keeps a child edited while the list was loading", () => {
    const ready = reducer(start, load([maya, liam]));
    const loading = reducer(ready, { type: "loading" });
    const edited = reducer(loading, { type: "edited", child: { ...maya, nickname: "Mimi" } });
    const done = reducer(edited, load([maya, liam]));
    expect(done.children.map((c) => c.nickname)).toEqual(["Mimi", "Liam"]);
  });
  it("trusts a list requested after the change", () => {
    const added = reducer(reducer(start, load([maya])), { type: "added", child: liam });
    const done = reducer(reducer(added, { type: "loading" }), load([maya]));
    expect(done.children).toEqual([maya]); // server says liam is gone
  });
  it("ignores answers meant for another user", () => {
    const loading = reducer(start, { type: "loading" });
    expect(reducer(loading, load([maya], "u2"))).toBe(loading);
    expect(reducer(loading, { type: "failed", userId: "u2", status: "error", error: new Error("x") })).toBe(loading);
  });
  it("stops listening for online when cleaned up", () => {
    const target = { addEventListener: vi.fn(), removeEventListener: vi.fn() };
    const fn = vi.fn();
    const stop = onOnline(fn, target);
    expect(target.addEventListener).toHaveBeenCalledWith("online", fn);
    stop();
    expect(target.removeEventListener).toHaveBeenCalledWith("online", fn);
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
    expect(html).toContain("We couldn&#x27;t reach LittleSteps.");
    expect(html).toContain("Try again.");
    expect(html).toContain("Retry");
  });
  it("unauthorized asks to sign in again, with no Retry", () => {
    const html = tabs({ status: "unauthorized" });
    expect(html).toContain("Please sign in again.");
    expect(html).not.toContain("Retry");
  });
  it("a failed refresh keeps the list and shows an alert above it", () => {
    const html = page(<ChildrenScreen />, state({ children: [maya], activeChild: maya, status: "error" }));
    expect(html).toContain("Retry");
    expect(html).toContain('href="/children/c1/edit"');
    expect(html.indexOf("Retry")).toBeLessThan(html.indexOf("child-list"));
  });
  it("a refresh in progress does not hide the list or the edit form", () => {
    const loading = state({ children: [maya], activeChild: maya, status: "loading" });
    const list = page(<ChildrenScreen />, loading);
    expect(list).toContain("Maya");
    expect(list).not.toContain("Loading your children");
    const edit = page(<Routes><Route path="/children/:childId/edit" element={<EditChildScreen />} /></Routes>, loading, "/children/c1/edit");
    expect(edit).toContain("<form");
  });
  it("edit shows the 404 state only once loaded, and a failed refresh keeps the form", () => {
    const edit = (ctx: Partial<ChildState>) =>
      page(<Routes><Route path="/children/:childId/edit" element={<EditChildScreen />} /></Routes>, state(ctx), "/children/c1/edit");
    expect(edit({ children: [liam], activeChild: liam })).toContain("We can&#x27;t open this profile.");
    expect(edit({ children: [], status: "loading" })).not.toContain("We can&#x27;t open this profile.");
    const kept = edit({ children: [maya], activeChild: maya, status: "offline" });
    expect(kept).toContain("<form");
    expect(kept).toContain("You&#x27;re offline.");
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
  it("keeps the switcher while a refresh runs or fails", () => {
    for (const status of ["loading", "error", "offline"] as const) {
      expect(switcher({ children: [maya], activeChild: maya, status })).toContain("child-switcher-button");
    }
  });
  it("states that it is not a diagnostic tool, in plain words", () => {
    const html = renderToStaticMarkup(<NonDiagnosticNotice />);
    expect(html).toContain("Not a diagnostic tool");
    expect(html).toContain("barangay health worker");
    expect(html).not.toMatch(/\b(delayed|behind|on track|normal|at risk)\b/);
  });
});

describe("chip switcher", () => {
  const chip = (ctx: Partial<ChildState>) => page(<ChildSwitcher variant="chip" />, state(ctx));
  it("is a menu button labelled For [child] with the age", () => {
    const html = chip({ children: [maya, liam], activeChild: maya });
    expect(html).toMatch(/<button[^>]*aria-haspopup="menu"/);
    expect(html).toContain("ls-badge child-chip");
    expect(html).toContain("For Maya · 12–23 months");
  });
  it("shows nothing without a child, while loading, or without a provider", () => {
    expect(chip({})).toBe("");
    expect(chip({ status: "loading" })).toBe("");
    expect(renderToStaticMarkup(<ChildSwitcher variant="chip" />)).toBe("");
  });
  it("is a plain badge on the edit form and absent on the add form", () => {
    const ctx = state({ children: [maya], activeChild: maya });
    const edit = page(<ChildForm child={liam} online onSubmit={vi.fn()} />, ctx);
    expect(edit).toContain("Editing Liam · 48–59 months");
    expect(edit).not.toContain("For Maya");
    expect(edit).not.toContain("aria-haspopup");
    expect(page(<ChildForm online onSubmit={vi.fn()} />, state({}))).not.toContain("child-chip");
  });
  it("gives each mounted switcher its own menu id", () => {
    const ids = [...page(<><ChildSwitcher variant="side" /><ChildSwitcher variant="chip" /></>, state({ children: [maya], activeChild: maya }))
      .matchAll(/aria-controls="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("success messages", () => {
  it("words them in plain spec style", () => {
    expect(addedMessage("Maya")).toBe("Maya added.");
    expect(savedMessage("Maya")).toBe("Changes to Maya saved.");
  });
  it("reads a message only from valid location state", () => {
    expect(readNotice(noticeState("Maya added."))).toBe("Maya added.");
    for (const bad of [null, undefined, {}, { notice: 3 }, { notice: "" }, "x"]) expect(readNotice(bad)).toBeUndefined();
  });
  it("belongs to the page it was raised on", () => {
    const notice = { message: "Maya added.", path: "/today" };
    expect(noticeFor(notice, "/today")).toBe("Maya added.");
    expect(noticeFor(notice, "/explore")).toBeUndefined();
    expect(noticeFor(undefined, "/today")).toBeUndefined();
  });
  it("announces politely with a labelled dismiss button and an icon, not colour alone", () => {
    const html = renderToStaticMarkup(<SuccessNotice message="Maya added." onClose={vi.fn()} />);
    expect(html).toContain('role="status"');
    expect(html).toContain("Maya added.");
    expect(html).toContain('aria-label="Dismiss message"');
    expect(html).toContain("<svg");
  });
  it("clears a message when the page changes, and keeps the same object otherwise", () => {
    const notice = { message: "Maya added.", path: "/today" };
    expect(keepNoticeOn(notice, "/today")).toBe(notice);
    expect(keepNoticeOn(notice, "/explore")).toBeUndefined();
    expect(keepNoticeOn(undefined, "/explore")).toBeUndefined();
  });
  it("keeps an empty status region mounted when there is no message", () => {
    const html = renderToStaticMarkup(<SuccessNotice onClose={vi.fn()} />);
    expect(html).toBe('<div role="status" aria-live="polite"></div>');
  });
  const list = (entry: object | string) => renderToStaticMarkup(
    <ChildContext.Provider value={state({ children: [maya], activeChild: maya })}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes><Route path="/children" element={<ChildrenScreen />} /></Routes>
      </MemoryRouter>
    </ChildContext.Provider>);
  it("shows no message without router state", () => {
    const html = list("/children");
    expect(html).not.toContain("ls-alert-success");
    expect(html).toContain('role="status"');
  });
  it("shows the message passed in router state inside the status region", () => {
    const html = list({ pathname: "/children", state: noticeState("Changes to Maya saved.") });
    expect(html).toMatch(/<div role="status" aria-live="polite"><div class="ls-alert ls-alert-success"[^>]*>.*Changes to Maya saved\./s);
    expect(html).toContain('aria-label="Dismiss message"');
  });
});

describe("switcher keys", () => {
  it("opens on ArrowDown or ArrowUp only", () => {
    expect(keyOpensMenu("ArrowDown")).toBe(true);
    expect(keyOpensMenu("ArrowUp")).toBe(true);
    expect(keyOpensMenu("Enter")).toBe(false);
  });
  it("starts on the checked item, else the first", () => {
    expect(initialIndex(2)).toBe(2);
    expect(initialIndex(-1)).toBe(0);
  });
  it("moves, wraps and jumps inside the menu", () => {
    expect(menuAction("ArrowDown", 0, 4)).toEqual({ focus: 1 });
    expect(menuAction("ArrowDown", 3, 4)).toEqual({ focus: 0 });
    expect(menuAction("ArrowDown", -1, 4)).toEqual({ focus: 0 });
    expect(menuAction("ArrowUp", 2, 4)).toEqual({ focus: 1 });
    expect(menuAction("ArrowUp", 0, 4)).toEqual({ focus: 3 });
    expect(menuAction("ArrowUp", -1, 4)).toEqual({ focus: 3 });
    expect(menuAction("Home", 2, 4)).toEqual({ focus: 0 });
    expect(menuAction("End", 1, 4)).toEqual({ focus: 3 });
    expect(menuAction("a", 1, 4)).toBeNull();
  });
  it("closes on Escape and Tab", () => {
    expect(menuAction("Escape", 1, 4)).toEqual({ close: true });
    expect(menuAction("Tab", 1, 4)).toEqual({ close: true });
  });
});

describe("editing a child whose stored age is out of range", () => {
  const values = initialValues(old);
  it("detects the out-of-range birth month", () => {
    expect(birthOutOfRange(old, NOW)).toBe(true);
    expect(birthOutOfRange(maya, NOW)).toBe(false);
    expect(birthOutOfRange(liam, NOW)).toBe(false);
  });
  it("lets a rename through without checking the unchanged age", () => {
    const renamed = { ...values, nickname: "Olive" };
    expect(validate(renamed, NOW).age).toBe(MSG.ageRange); // plain validation would block it
    expect(ageChanged(renamed, old)).toBe(false);
    expect(validateForm(renamed, old, NOW)).toEqual({});
    expect(prepareSubmit(renamed, old, NOW)).toEqual({ input: { nickname: "Olive" } });
  });
  it("still checks the age when it was changed", () => {
    expect(validateForm({ ...values, month: "4" }, old, NOW).age).toBe(MSG.ageRange);
    expect(validateForm({ ...values, mode: "band", band: "" }, old, NOW).age).toBe(MSG.bandMissing);
    expect(prepareSubmit({ ...values, mode: "band", band: "60-71m" }, old, NOW)).toEqual({ input: { ageBand: "60-71m" } });
  });
  it("shows the stored age as text and keeps the nickname editable", () => {
    vi.useFakeTimers({ now: NOW, toFake: ["Date"] });
    const html = renderToStaticMarkup(<ChildForm child={old} online onSubmit={vi.fn()} />);
    vi.useRealTimers();
    expect(html).toContain("March 2019");
    expect(html).toContain("60–71 months");
    expect(html).not.toContain("Choose a year");
    expect(html).toContain('value="Old"');
  });
});

describe("form submit building", () => {
  it("returns errors, nothing, or the input", () => {
    expect(prepareSubmit(blank, undefined, NOW)).toEqual({ errors: { nickname: MSG.nicknameMissing, age: MSG.monthMissing } });
    expect(prepareSubmit({ ...blank, nickname: " Ana ", month: "8", year: "2025" }, undefined, NOW)).toEqual({
      input: { nickname: "Ana", birthMonthYear: "2025-08" }
    });
    expect(prepareSubmit(initialValues(maya), maya, NOW)).toEqual({ input: null });
    expect(prepareSubmit({ ...initialValues(maya), nickname: "Mimi" }, maya, NOW)).toEqual({ input: { nickname: "Mimi" } });
  });
});

describe("error announcements", () => {
  it("form-level alert can take focus", () => {
    const html = renderToStaticMarkup(<InlineAlert kind="error" title="t" tabIndex={-1} />);
    expect(html).toContain('tabindex="-1"');
    expect(html).toContain('role="alert"');
  });
  it("field messages are linked by aria-describedby and are not live regions of their own", () => {
    // Focus moves to the invalid control and reads its description once; a role="alert" would repeat it.
    const html = renderToStaticMarkup(<TextField label="Nickname" error="Add a nickname." />);
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain("Add a nickname.");
    expect(html.match(/role="alert"/g) ?? []).toHaveLength(0);
  });
});
