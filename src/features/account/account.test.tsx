import { readFileSync } from "node:fs";
import { isValidElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import type { User } from "firebase/auth";
import { describe, expect, it, vi } from "vitest";
import { App } from "../../App";
import { AuthContext } from "../auth/context";
import { ACCOUNT_PATHS } from "./content";

const signOut = vi.fn();
vi.mock("firebase/auth", () => ({ onIdTokenChanged: vi.fn(), signInWithEmailAndPassword: vi.fn(), signOut: vi.fn() }));
vi.mock("../../services/firebase", () => ({ auth: {} }));

const user = { uid: "u1", email: "parent@example.com" } as User;
function render(path: string) {
  return renderToStaticMarkup(
    <AuthContext.Provider value={{ user, loading: false, signIn: vi.fn(), createAccount: vi.fn(), signOut }}>
      <MemoryRouter initialEntries={[path]}><App /></MemoryRouter>
    </AuthContext.Provider>
  );
}

const pages: [string, string][] = [
  [ACCOUNT_PATHS.menu, "Account"],
  [ACCOUNT_PATHS.settings, "Settings"],
  [ACCOUNT_PATHS.privacy, "Privacy notice"],
  [ACCOUNT_PATHS.about, "About LittleSteps"],
  [ACCOUNT_PATHS.help, "Help and support"],
];

describe("Account pages", () => {
  it.each(pages)("%s has one h1 and its title", (path, title) => {
    const html = render(path);
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain(`<title>${title} · LittleSteps</title>`);
    expect(html).toContain(`>${title}</h1>`);
    expect(html.match(/<main/g)).toHaveLength(1);
  });

  it("invents no email address and no contact", () => {
    for (const [path] of pages.slice(1)) {
      expect(render(path).replace(user.email!, "")).not.toMatch(/[\w.-]+@[\w-]+\.\w+/);
    }
    expect(render(ACCOUNT_PATHS.privacy)).toContain("Privacy contact: to be confirmed by the team.");
  });

  it("marks export and delete as unavailable with an explanation", () => {
    const html = render(ACCOUNT_PATHS.settings);
    for (const [label, id] of [["Download my data", "export-note"], ["Delete a child&#x27;s records or my account", "delete-note"]]) {
      expect(html).toMatch(new RegExp(`<button[^>]*aria-disabled="true"[^>]*aria-describedby="${id}"[^>]*>${label}</button>`));
      expect(html).toMatch(new RegExp(`id="${id}"[^>]*>[^<]*not available yet`));
    }
  });

  it("wires Settings sign-out to useAuth", async () => {
    vi.resetModules();
    vi.doMock("../auth", () => ({ useAuth: () => ({ user, signOut }) }));
    const { SettingsScreen } = await import("./components/SettingsScreen");
    const find = (node: ReactNode): ((...a: unknown[]) => void) | undefined => {
      if (!isValidElement<{ onClick?: () => void; children?: ReactNode }>(node)) return Array.isArray(node) ? node.map(find).find(Boolean) : undefined;
      if (node.props.children === "Sign out") return node.props.onClick;
      if (typeof node.type === "function" && node.type.name === "AccountPage") return find(node.props.children);
      return find(node.props.children);
    };
    // Calls the component as a plain function: it only reads useAuth, which is mocked above.
    find(SettingsScreen())?.();
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it("links between the pages go to routes in App.tsx", () => {
    const routes = [...readFileSync("src/App.tsx", "utf8").matchAll(/path="([^"]+)"/g)].map((m) => m[1]);
    const html = [render(ACCOUNT_PATHS.menu), render(ACCOUNT_PATHS.settings)].join();
    const hrefs = [...html.matchAll(/<a [^>]*href="(\/account[^"]*)"/g)].map((m) => m[1]);
    expect(hrefs).toEqual(expect.arrayContaining(Object.values(ACCOUNT_PATHS).slice(1)));
    for (const href of new Set(hrefs)) expect(routes).toContain(href);
    for (const path of Object.values(ACCOUNT_PATHS)) expect(routes).toContain(path);
  });

  it("privacy notice has the required sections in order", () => {
    const html = render(ACCOUNT_PATHS.privacy);
    const h2 = [...html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/g)].map((m) => m[1]);
    expect(h2).toEqual(["What we collect", "Why we collect it", "Who can see it", "Your rights", "How long we keep it", "If something goes wrong", "Contact"]);
    expect(html).toContain("never sent to AI, analytics or error logs");
    expect(html).toContain("proposal and has not been approved");
  });

  it("help uses native details and about names the AI label", () => {
    expect(render(ACCOUNT_PATHS.help).match(/<details/g)?.length).toBeGreaterThanOrEqual(6);
    expect(render(ACCOUNT_PATHS.about)).toContain("Suggested by AI");
  });
});
