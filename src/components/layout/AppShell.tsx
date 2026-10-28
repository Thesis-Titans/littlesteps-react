import { Outlet, useOutletContext } from "react-router-dom";
import { Button, InlineAlert } from "../common";
import { BottomTabBar } from "./BottomTabBar";
import type { ShellContext } from "./ProtectedRoute";
import { SideNav } from "./SideNav";
import { TopBar } from "./TopBar";

/** The single <main> landmark lives here; screens render a <section>. */
export function AppShell() {
  const { sessionProblem, retry } = useOutletContext<ShellContext>();
  return (
    <div className="app-shell">
      <TopBar />
      <SideNav />
      <main className="app-main">
        {sessionProblem && (
          <InlineAlert
            kind={sessionProblem}
            title="We couldn't check your account."
            action={<Button variant="secondary" onClick={retry}>Retry</Button>}
          >
            Your saved notes are safe.
          </InlineAlert>
        )}
        <Outlet />
      </main>
      <BottomTabBar />
    </div>
  );
}
