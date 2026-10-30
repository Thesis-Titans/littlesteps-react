import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import type { User } from "firebase/auth";
import { describe, expect, it, vi } from "vitest";
import { App } from "../../App";
import { ScreenHeader } from "./ScreenHeader";
import { AuthContext } from "../../features/auth/context";
import type { AuthState } from "../../features/auth";
import { ChildContext } from "../../features/children/context";
import type { Child } from "../../features/children";

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

function renderHeader(activeChild: Child | null, childScoped?: boolean) {
  return renderToStaticMarkup(
    <ChildContext.Provider value={{ activeChild, setActiveChild: vi.fn() }}>
      <ScreenHeader id="t" title="Today" childScoped={childScoped} />
    </ChildContext.Provider>
  );
}

const caregiver = { uid: "u1", email: "parent@example.com" } as User;
// The soft hyphen in the Milestones label is invisible unless the word wraps, so it is stripped for the comparison.
const tabLabels = (html: string) => [...html.matchAll(/class="tab-link[^"]*"[^>]*>[\s\S]*?<span>([^<]+)<\/span>/g)].map((m) => m[1].replace(/\u00AD/g, ""));

describe("AppShell", () => {
  it("shows the five tabs in order, marks the current one and has one main landmark", () => {
    const html = render("/explore", caregiver);
    // Sidebar and bottom bar each render the same five tabs; CSS shows one per viewport.
    expect(tabLabels(html)).toEqual(Array(2).fill(["Today", "Explore", "Milestones", "Journal", "This week"]).flat());
    expect(html.match(/<a aria-current="page"[^>]*href="\/explore"/g)).toHaveLength(2);
    expect(html).toContain("Mile\u00ADstones");
    expect(html.match(/<main/g)).toHaveLength(1);
    expect(html).toContain('<h1 id="explore-title">Explore</h1>');
    expect(html).toContain("<title>Explore · LittleSteps</title>");
  });

  it("shows the child label in child-scoped page headers once a child is chosen", () => {
    const maya = { id: "c1", nickname: "Maya", ageBand: "14 months" };
    expect(render("/today", caregiver)).not.toContain("child-chip");
    expect(renderHeader(null)).not.toContain("child-chip");
    expect(renderHeader(maya)).toContain("For Maya · 14 months");
    expect(renderHeader(maya, false)).not.toContain("child-chip");
  });

  it("shows sign-in instead of the shell when signed out", () => {
    const html = render("/journal", null);
    expect(html).toContain('class="sign-in-page"');
    expect(html).not.toContain("tab-link");
    expect(html).not.toContain("journal-title");
  });
});
