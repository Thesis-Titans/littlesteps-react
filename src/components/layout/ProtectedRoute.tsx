import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { SignInForm, useAuth } from "../../features/auth";
import { ChildProvider } from "../../features/children";
import { onOnline } from "../../features/children/state";
import { checkSession, type SessionProblem } from "./sessionCheck";

export type ShellContext = { sessionProblem?: SessionProblem; retry: () => void };

/** Signed-out caregivers see sign-in at the URL they asked for, so they land there after signing in. */
export function ProtectedRoute() {
  const { user, loading, signOut } = useAuth();
  const [notice, setNotice] = useState<string>();
  const [sessionProblem, setSessionProblem] = useState<SessionProblem>();
  const [retries, setRetries] = useState(0);

  useEffect(() => {
    if (!user) return;
    let active = true;
    void checkSession(signOut).then((result) => {
      // Keep the sign-out notice even if sign-out already re-rendered this route.
      if (result.notice) setNotice(result.notice);
      if (!active) return;
      if (!result.notice) setNotice(undefined);
      setSessionProblem(result.problem);
    });
    return () => {
      active = false;
    };
  }, [user, signOut, retries]);

  // Re-run the account check when the connection returns, so its alert clears like the child list's does.
  useEffect(() => onOnline(() => setRetries((count) => count + 1)), []);

  if (loading) return <main className="auth-loading"><p role="status">Loading your session…</p></main>;
  if (!user) return <SignInForm notice={notice} />;
  const context: ShellContext = { sessionProblem, retry: () => setRetries((count) => count + 1) };
  // Keyed by user so a chosen child never carries over to the next person who signs in.
  return (
    <ChildProvider key={user.uid} userId={user.uid}>
      <Outlet context={context} />
    </ChildProvider>
  );
}
