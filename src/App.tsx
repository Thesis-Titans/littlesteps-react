import { useState } from "react";
import { getApiHealth } from "./api";

type CheckState = "idle" | "loading" | "success" | "error";

export function App() {
  const [checkState, setCheckState] = useState<CheckState>("idle");
  const [message, setMessage] = useState("Not checked yet.");

  async function checkApi() {
    setCheckState("loading");
    setMessage("Checking the local API…");
    try {
      await getApiHealth();
      setCheckState("success");
      setMessage("The API health endpoint responded successfully.");
    } catch (error) {
      setCheckState("error");
      setMessage(error instanceof Error ? error.message : "The API check failed.");
    }
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="LittleSteps home">
          <span className="brand-mark" aria-hidden="true">L</span>
          <span>LittleSteps</span>
        </a>
        <span className="environment-tag">Development foundation</span>
      </header>

      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">Small moments. Meaningful growth.</p>
        <h1 id="page-title">A thoughtful space for early learning.</h1>
        <p className="hero-copy">
          LittleSteps is being built to help caregivers plan activities, keep observations,
          explore learning resources, and reflect on a child’s week.
        </p>
        <div className="status-panel">
          <div>
            <p className="panel-label">API connection</p>
            <p className="status-message" role="status" aria-live="polite">{message}</p>
          </div>
          <button onClick={checkApi} disabled={checkState === "loading"}>
            {checkState === "loading" ? "Checking…" : "Check local API"}
          </button>
        </div>
        <p className={`status-note ${checkState}`}>
          {checkState === "success" ? "Connected" : checkState === "error" ? "Not connected" : "Local integration only"}
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
        <p className="disclaimer">This screen is a development scaffold. The six features above are not implemented yet. LittleSteps is not a diagnostic or medical tool.</p>
      </section>
      <footer>LittleSteps · Early learning and caregiver support</footer>
    </main>
  );
}
