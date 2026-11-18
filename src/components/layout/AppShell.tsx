import { Outlet, useOutletContext } from "react-router-dom";
import { useChild } from "../../features/children/useChild";
import { Button, InlineAlert } from "../common";
import { BottomTabBar } from "./BottomTabBar";
import type { ShellContext } from "./ProtectedRoute";
import { SideNav } from "./SideNav";
import { TopBar } from "./TopBar";
import { useFocusHeadingOnNavigate } from "./useFocusHeadingOnNavigate";

/** The single <main> landmark lives here; screens render a <section>. */
export function AppShell() {
  const context = useOutletContext<ShellContext>();
  const { sessionProblem, retry } = context;
  const { refresh } = useChild();
  // One Retry for both checks, so a single alert never leaves the children load behind.
  const retryAll = () => { retry(); refresh(); };
  useFocusHeadingOnNavigate();
  return (
    <div className="app-shell">
      {/* WCAG 2.4.1: lets keyboard users jump past the top bar and navigation. */}
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <TopBar />
      <SideNav />
      <main className="app-main" id="main-content" tabIndex={-1}>
        {sessionProblem && (
          <InlineAlert
            kind={sessionProblem}
            title="We couldn't check your account."
            action={<Button variant="secondary" onClick={retryAll}>Retry</Button>}
          >
            Your saved notes are safe.
          </InlineAlert>
        )}
        <Outlet context={context} />
      </main>
      <BottomTabBar />
    </div>
  );
}
