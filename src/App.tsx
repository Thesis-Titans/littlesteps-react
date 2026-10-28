import { useEffect, useState } from "react";
import { getCurrentUser, UnauthorizedError } from "./services/api";
import { SignInForm, useAuth } from "./features/auth";
import growthSymbol from "./assets/brand/brandmark.svg";

type CheckState = "loading" | "success" | "error";

function SessionStatus({ onNotice }: { onNotice: (message?: string) => void }) {
  const { user, signOut } = useAuth();
  const [checkState, setCheckState] = useState<CheckState>("loading");
  const [uid, setUid] = useState<string>();
  const [message, setMessage] = useState("Checking your session…");

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then((currentUser) => {
        if (!active) return;
        onNotice(undefined);
        setUid(currentUser.uid);
        setCheckState("success");
        setMessage("Connected");
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof UnauthorizedError) {
          onNotice(error.message);
          void signOut();
          return;
        }
        setCheckState("error");
        setMessage(error instanceof Error ? error.message : "We couldn't confirm your session.");
      });
    return () => {
      active = false;
    };
  }, [onNotice, signOut]);

  return (
    <section className="session-card" aria-labelledby="session-title">
      <h1 id="session-title">Session status</h1>
      <dl className="session-details">
        <dt>Email</dt>
        <dd>{user?.email ?? "—"}</dd>
        <dt>Verified UID</dt>
        <dd className="session-uid">{uid ?? "—"}</dd>
        <dt>Connection</dt>
        <dd>
          <span className={`status-note ${checkState}`} role="status" aria-live="polite">{message}</span>
        </dd>
      </dl>
      <button type="button" className="secondary-button" onClick={() => void signOut()}>
        Sign out
      </button>
    </section>
  );
}

export function App() {
  const { user, loading } = useAuth();
  const [notice, setNotice] = useState<string>();

  if (!loading && !user) return <SignInForm notice={notice} />;

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="LittleSteps home">
          <img className="brand-mark" src={growthSymbol} alt="" width={36} height={36} />
          <span>LittleSteps</span>
        </a>
        <span className="environment-tag">Development foundation</span>
      </header>

      {loading ? (
        <p className="auth-loading" role="status">Loading your session…</p>
      ) : (
        <SessionStatus onNotice={setNotice} />
      )}
    </main>
  );
}
