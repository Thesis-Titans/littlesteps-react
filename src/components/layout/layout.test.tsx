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

vi.mock("firebase/auth", () => ({ onIdTokenChanged: vi.fn(), signInWithEmailAndPassword: vi.fn(), signOut: vi.fn() }));
vi.mock("../../services/firebase", () => ({ auth: {} }));

function render(path: string, user: User | null) {
  const auth: AuthState = { user, loading: false, signIn: vi.fn(), signOut: vi.fn() };
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
    <ChildContext.Provider value={{ ...noopState, activeChild }}>
      <ScreenHeader id="t" title="Today" childScoped={childScoped} />
    </ChildContext.Provider>
  );
}

const caregiver = { uid: "u1", email: "parent@example.com" } as User;
const tabLabels = (html: string) => [...html.matchAll(/class="tab-link[^"]*"[^>]*>[\s\S]*?<span>([^<]+)<\/span>/g)].map((m) => m[1]);

describe("AppShell", () => {
  it("shows the five tabs in order, marks the current one and has one main landmark", () => {
    const html = render("/explore", caregiver);
    // Sidebar and bottom bar each render the same five tabs; CSS shows one per viewport.
    expect(tabLabels(html)).toEqual(Array(2).fill(["Today", "Explore", "Milestones", "Journal", "This week"]).flat());
    expect(html.match(/<a aria-current="page"[^>]*href="\/explore"/g)).toHaveLength(2);
    expect(html.match(/<main/g)).toHaveLength(1);
    // Tab screens wait for the child list (loading here); the page title is checked on Account.
    expect(html).toContain("Loading your children…");
    const account = render("/account", caregiver);
    expect(account).toContain('<h1 id="account-title">Account</h1>');
    expect(account).toContain("<title>Account · LittleSteps</title>");
    expect(account).toContain('href="/children"');
  });

  it("shows the child label in child-scoped page headers once a child is chosen", () => {
    const maya: Child = {
      id: "c1",
      nickname: "Maya",
      ageBand: "12-23m",
      createdAt: "2026-10-29T08:00:00Z",
      updatedAt: "2026-10-29T08:00:00Z"
    };
    expect(render("/today", caregiver)).not.toContain("child-chip");
    expect(renderHeader(null)).not.toContain("child-chip");
    expect(renderHeader(maya)).toContain("For Maya · 12–23 months");
    expect(renderHeader(maya, false)).not.toContain("child-chip");
  });

  it("shows sign-in instead of the shell when signed out", () => {
    const html = render("/journal", null);
    expect(html).toContain('class="sign-in-page"');
    expect(html).not.toContain("tab-link");
    expect(html).not.toContain("journal-title");
  });
});
