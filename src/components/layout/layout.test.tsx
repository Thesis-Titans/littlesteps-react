import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import type { User } from "firebase/auth";
import { describe, expect, it, vi } from "vitest";
import { App } from "../../App";
import { ScreenHeader } from "./ScreenHeader";
import { AuthContext } from "../../features/auth/context";
import type { AuthState } from "../../features/auth";
import { ChildContext } from "../../features/children/context";
import type { Child, ChildState } from "../../features/children";

// ProtectedRoute mounts the real provider, which would fetch; the tests choose the child state instead.
const childCtx = vi.hoisted(() => ({ value: null as ChildState | null }));
vi.mock("../../features/children/ChildProvider", async () => {
  const { ChildContext: Context } = await import("../../features/children/context");
  return { ChildProvider: ({ children }: { children: ReactNode }) => createElement(Context.Provider, { value: childCtx.value }, children) };
});
vi.mock("firebase/auth", () => ({ onIdTokenChanged: vi.fn(), signInWithEmailAndPassword: vi.fn(), createUserWithEmailAndPassword: vi.fn(), signOut: vi.fn() }));
vi.mock("../../services/firebase", () => ({ auth: {} }));

function render(path: string, user: User | null) {
  const auth: AuthState = { user, loading: false, signIn: vi.fn(), createAccount: vi.fn(), signOut: vi.fn() };
  return renderToStaticMarkup(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

const noopState: ChildState = {
  children: [], activeChild: null, status: "ready", error: null,
  setActiveChild: vi.fn(), refresh: vi.fn(), addChild: vi.fn(), editChild: vi.fn()
};

function renderHeader(activeChild: Child | null, childScoped?: boolean) {
  return renderToStaticMarkup(
    <ChildContext.Provider value={{ ...noopState, activeChild, children: activeChild ? [activeChild] : [] }}>
      <ScreenHeader id="t" title="Today" childScoped={childScoped} />
    </ChildContext.Provider>
  );
}

const maya: Child = {
  id: "c1",
  nickname: "Maya",
  ageBand: "12-23m",
  createdAt: "2026-10-29T08:00:00Z",
  updatedAt: "2026-10-29T08:00:00Z"
};
const readyState: ChildState = { ...noopState, children: [maya], activeChild: maya };
const loadingState: ChildState = { ...noopState, status: "loading" };

const caregiver = { uid: "u1", email: "parent@example.com" } as User;
// The soft hyphen in the Milestones label is invisible unless the word wraps, so it is stripped for the comparison.
const tabLabels = (html: string) => [...html.matchAll(/class="tab-link[^"]*"[^>]*>[\s\S]*?<span>([^<]+)<\/span>/g)].map((m) => m[1].replace(/\u00AD/g, ""));

describe("AppShell", () => {
  it("shows the five tabs in order, marks the current one and has one main landmark", () => {
    childCtx.value = readyState;
    const html = render("/explore", caregiver);
    // Sidebar and bottom bar each render the same five tabs; CSS shows one per viewport.
    expect(tabLabels(html)).toEqual(Array(2).fill(["Today", "Explore", "Milestones", "Journal", "This week"]).flat());
    expect(html.match(/<a aria-current="page"[^>]*href="\/explore"/g)).toHaveLength(2);
    expect(html).toContain("Mile\u00ADstones");
    expect(html.match(/<main/g)).toHaveLength(1);
    expect(html).toContain('<h1 id="explore-title" tabindex="-1">Explore</h1>');
    expect(html).toContain("<title>Explore · LittleSteps</title>");
    const account = render("/account", caregiver);
    expect(account).toContain('<h1 id="account-title" tabindex="-1">Account</h1>');
    expect(account).toContain("<title>Account · LittleSteps</title>");
    expect(account).toContain('href="/children"');
  });

  it("holds tab screens back while the child list loads", () => {
    childCtx.value = loadingState;
    const html = render("/explore", caregiver);
    expect(html).toContain("Loading your children…");
    expect(html).not.toContain('id="explore-title"');
  });

  it("shows the child label in child-scoped page headers once a child is chosen", () => {
    childCtx.value = loadingState;
    expect(render("/today", caregiver)).not.toContain("child-chip");
    expect(renderHeader(null)).not.toContain("child-chip");
    const chip = renderHeader(maya);
    expect(chip).toMatch(/<button[^>]*aria-haspopup="menu"[^>]*>For Maya · 12–23 months/);
    expect(chip).toContain("ls-badge child-chip");
    expect(chip).toContain('aria-expanded="false"');
    expect(renderHeader(maya, false)).not.toContain("child-chip");
  });

  it("shows the create-account form at /create-account when signed out, sign-in elsewhere", () => {
    const html = render("/create-account", null);
    expect(html).toContain("Create an account</h1>");
    expect(html).toContain('autoComplete="new-password"');
    expect(html).toContain('href="/"');
    expect(html).toContain("I have read the privacy summary above");
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(render("/anything", null)).toContain('href="/create-account"');
  });

  it("redirects a signed-in user away from /create-account", () => {
    expect(render("/create-account", { uid: "u1" } as User)).not.toContain("Create an account</h1>");
  });

  it("shows sign-in instead of the shell when signed out", () => {
    const html = render("/journal", null);
    expect(html).toContain('class="sign-in-page"');
    expect(html).not.toContain("tab-link");
    expect(html).not.toContain("journal-title");
  });
});
