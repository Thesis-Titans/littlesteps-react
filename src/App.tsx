import { useEffect, useState } from "react";
import { getCurrentUser, UnauthorizedError } from "./api";
import { useAuth } from "./auth/useAuth";
import { SignInForm } from "./components/SignInForm";

type CheckState = "loading" | "success" | "error";

function Dashboard({ onNotice }: { onNotice: (message?: string) => void }) {
  const { user, signOut } = useAuth();
  const [checkState, setCheckState] = useState<CheckState>("loading");
  const [message, setMessage] = useState("Confirming your session with the LittleSteps API…");

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then(() => {
        if (!active) return;
        onNotice(undefined);
        setCheckState("success");
        setMessage("Your session is verified by the LittleSteps API.");
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
    <>
      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">Small moments. Meaningful growth.</p>
        <h1 id="page-title">Welcome back.</h1>
        <p className="hero-copy">
          LittleSteps is being built to help caregivers plan activities, keep observations,
          explore learning resources, and reflect on a child’s week.
        </p>
        <div className="status-panel">
          <div>
            <p className="panel-label">Signed in as</p>
            <p className="status-message">{user?.email ?? "Caregiver"}</p>
            <p className="status-message" role="status" aria-live="polite">{message}</p>
          </div>
          <button type="button" className="secondary-button" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
        <p className={`status-note ${checkState}`}>
          {checkState === "success" ? "Session verified" : checkState === "error" ? "Not verified" : "Checking…"}
        </p>
      </section>

      <section className="feature-section" aria-labelledby="features-title">
        <p className="eyebrow">Product direction</p>
        <h2 id="features-title">Six connected features</h2>
        <div className="feature-grid">
          <article><span>01</span><h3>Child profile</h3><p>Keep age-aware observations together.</p></article>
          <article><span>02</span><h3>Daily activities</h3><p>Plan simple activities and track participation.</p></article>
          <article><span>03</span><h3>Private journal</h3><p>Record caregiver observations with privacy in mind.</p></article>
          <article><span>04</span><h3>Learning library</h3><p>Explore reviewed stories, rhymes, and activities.</p></article>
          <article><span>05</span><h3>Weekly summary</h3><p>Reflect on recorded moments without diagnosis.</p></article>
          <article><span>06</span><h3>Activity helper</h3><p>Suggest catalog activities with caregiver guidance.</p></article>
        </div>
        <p className="disclaimer">The six features above are not implemented yet. LittleSteps is not a diagnostic or medical tool.</p>
      </section>
    </>
  );
}

export function App() {
  const { user, loading } = useAuth();
  const [notice, setNotice] = useState<string>();

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="LittleSteps home">
          <span className="brand-mark" aria-hidden="true">L</span>
          <span>LittleSteps</span>
        </a>
        <span className="environment-tag">Development foundation</span>
      </header>

      {loading ? (
        <p className="auth-loading" role="status">Loading your session…</p>
      ) : user ? (
        <Dashboard onNotice={setNotice} />
      ) : (
        <SignInForm notice={notice} />
      )}
      <footer>LittleSteps · Early learning and caregiver support</footer>
    </main>
  );
}
