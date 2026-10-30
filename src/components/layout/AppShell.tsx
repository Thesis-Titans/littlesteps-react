import { Outlet, useOutletContext } from "react-router-dom";
import { useChild } from "../../features/children/useChild";
import { Button, InlineAlert } from "../common";
import { BottomTabBar } from "./BottomTabBar";
import type { ShellContext } from "./ProtectedRoute";
import { SideNav } from "./SideNav";
import { TopBar } from "./TopBar";

/** The single <main> landmark lives here; screens render a <section>. */
export function AppShell() {
  const context = useOutletContext<ShellContext>();
  const { sessionProblem, retry } = context;
  const { refresh } = useChild();
  // One Retry for both checks, so a single alert never leaves the children load behind.
  const retryAll = () => { retry(); refresh(); };
  return (
    <div className="app-shell">
      <TopBar />
      <SideNav />
      <main className="app-main">
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
