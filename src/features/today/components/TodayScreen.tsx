import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Chip, EmptyState, InlineAlert, Skeleton, UndoToast } from "../../../components/common";
import { ScreenHeader } from "../../../components/layout";
import { useWeather } from "../../../services/weather";
import { NonDiagnosticNotice } from "../../children/components/NonDiagnosticNotice";
import { useChild } from "../../children/useChild";
import { HISTORY_LIMIT, useToday } from "../hooks/useToday";
import { localDate, matchesFilters, QUICK_FILTERS } from "../logic";
import type { QuickFilter } from "../types";
import { PlanCard } from "./PlanCard";

const SEEN_KEY = "ls.advisorySeen"; // a yes/no flag only, no child data

const readSeen = () => {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
};

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/** Today screen: the selected child's plan, quick filters, mark complete, widgets and history. */
export function TodayScreen() {
  const { activeChild } = useChild();
  const [showAdvisory, setShowAdvisory] = useState(() => !readSeen());
  const hideAdvisory = () => {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* private mode: it shows again next visit */
    }
    setShowAdvisory(false);
  };

  return (
    <section className="screen today-screen" aria-labelledby="today-title">
      <ScreenHeader id="today-title" title="Today" subtitle="Your plan for today." />
      {showAdvisory ? (
        <NonDiagnosticNotice action={<Button variant="secondary" onClick={hideAdvisory}>Hide this notice</Button>} />
      ) : (
        <Button variant="text" onClick={() => setShowAdvisory(true)}>Not a diagnostic tool</Button>
      )}
      {/* Keyed by child so switching children starts a fresh load. */}
      {activeChild && (
        <TodayPlan
          key={activeChild.id}
          childId={activeChild.id}
          nickname={activeChild.nickname}
          ageBand={activeChild.ageBand}
        />
      )}
    </section>
  );
}

function TodayPlan({
  childId,
  nickname,
  ageBand,
}: {
  childId: string;
  nickname: string;
  ageBand: string;
}) {
  const [today, setToday] = useState(localDate);
  const { load, reload, busyIds, settled, problem, toast, markComplete, undo, closeToast } = useToday(childId, today);
  const { weather } = useWeather();
  const root = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [filters, setFilters] = useState<QuickFilter[]>([]);
  const navigate = useNavigate();

  // A tab left open overnight picks up the new day when the caregiver comes back to it.
  useEffect(() => {
    const check = () => setToday(localDate());
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);

  // The pressed button may be gone now: focus goes to the toast's Undo, the alert's Retry, or the plan heading.
  useEffect(() => {
    if (settled.n === 0) return;
    const active = document.activeElement;
    const card = root.current?.querySelector(`[data-plan-id="${settled.planId}"]`);
    if (active && active !== document.body && !card?.contains(active)) return;
    const target = root.current?.querySelector<HTMLElement>(".plan-toast button, .plan-problem button") ?? heading.current;
    target?.focus();
  }, [settled]);

  const toggle = (id: QuickFilter) => setFilters((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  if (load.status === "loading") {
    return (
      <div className="plan-list" aria-busy="true">
        <Skeleton kind="card" label={`Loading ${nickname}'s plan…`} />
        <Skeleton kind="card" label="Loading activities" />
      </div>
    );
  }
  if (load.status === "unauthorized") {
    return <InlineAlert kind="error" title="Please sign in again to continue">Your session has ended. Your saved notes are safe.</InlineAlert>;
  }
  if (load.status !== "ready") {
    const offline = load.status === "offline";
    return (
      <InlineAlert
        kind={offline ? "offline" : "error"}
        title={offline ? "You're offline." : "We couldn't reach LittleSteps."}
        action={<Button variant="secondary" onClick={reload}>Retry</Button>}
      >
        {offline ? `We can't load ${nickname}'s plan right now. Reconnect and try again.` : "Try again. Your saved notes are safe."}
      </InlineAlert>
    );
  }

  const { plans, history, activities } = load;
  const shown = plans.filter((p) => matchesFilters(activities[p.activityId], filters));

  return (
    <div className="plan-root" ref={root}>
      {/* Hero Greeting */}
      <header className="today-hero">
        <h2 className="today-hero-title">
          {getTimeGreeting()}!
        </h2>
        <p className="today-hero-sub">
          Today's plan for {nickname} &middot; {ageBand}
        </p>
      </header>

      {/* Optional Weather Hint (react #19) */}
      {weather && (weather.hint || (weather.condition && weather.condition !== "unavailable")) && (
        <aside className="today-weather-banner" role="status" aria-label="Weather play hint">
          <div className="today-weather-info">
            <span aria-hidden="true">{weather.condition === "rainy" ? "🌧️" : "☀️"}</span>
            <span>
              {weather.hint ??
                (weather.condition === "rainy"
                  ? "Rain likely · Indoor ideas recommended"
                  : "Good weather for outdoor play · Outdoor ideas")}
            </span>
          </div>
          <span className="today-weather-attr">Weather data by Open-Meteo.com</span>
        </aside>
      )}

      <div className="today-grid">
        {/* Main Column */}
        <div className="today-main-col">
          {problem && (
            <div className="plan-problem">
              <InlineAlert
                kind={problem.kind === "offline" ? "offline" : "error"}
                title={problem.message}
                action={problem.retry && <Button variant="secondary" onClick={problem.retry}>Retry</Button>}
              />
            </div>
          )}

          <section className="plan-section" aria-labelledby="plan-heading">
            <h2 id="plan-heading" className="plan-heading" tabIndex={-1} ref={heading}>
              {nickname}'s plan for today
            </h2>
            {plans.length > 0 && (
              <div className="plan-filters" role="group" aria-label="Quick filters">
                {QUICK_FILTERS.map((f) => (
                  <Chip key={f.id} selected={filters.includes(f.id)} onClick={() => toggle(f.id)}>
                    {f.label}
                  </Chip>
                ))}
              </div>
            )}
            {plans.length === 0 ? (
              <EmptyState
                title="No activities planned for today."
                action={<Button variant="secondary" onClick={() => navigate("/explore")}>Find an activity</Button>}
              >
                <p>Want a quick idea? Most take 10 minutes or less.</p>
              </EmptyState>
            ) : shown.length === 0 ? (
              <EmptyState
                title="No planned activities match these filters."
                action={<Button variant="secondary" onClick={() => setFilters([])}>Clear filters</Button>}
              />
            ) : (
              <ul className="plan-list">
                {shown.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    activity={activities[plan.activityId]}
                    busy={busyIds.includes(plan.id)}
                    onComplete={markComplete}
                  />
                ))}
              </ul>
            )}
          </section>

          {toast && (
            <div className="plan-toast">
              <UndoToast
                message={`${activities[toast.activityId]?.title ?? "Activity"} marked complete.`}
                onUndo={undo}
                onClose={closeToast}
              />
            </div>
          )}

          <section className="plan-section" aria-labelledby="history-heading">
            <h2 id="history-heading" className="plan-heading">History</h2>
            {history.length === 0 ? (
              <p className="plan-card-meta">Completed activities for {nickname} will show here.</p>
            ) : (
              <>
                {load.historyCut && (
                  <p className="plan-card-meta">
                    This list shows the first {HISTORY_LIMIT} completed activities. Newer ones may be missing.
                  </p>
                )}
                <ul className="plan-list">
                  {history.map((plan) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      activity={activities[plan.activityId]}
                      showDate
                    />
                  ))}
                </ul>
              </>
            )}
          </section>
        </div>

        {/* Desktop Side Column with Widgets (react #45) */}
        <aside className="today-side-col" aria-label="Quick shortcuts and summaries">
          {/* Idea Helper Widget */}
          <div className="today-side-widget">
            <h3 className="today-side-widget-title">Need a quick idea?</h3>
            <p className="today-side-widget-body">
              Find personalized play ideas for {nickname} using everyday items around the house.
            </p>
            <Button variant="secondary" onClick={() => navigate("/explore")}>
              Find an idea
            </Button>
          </div>

          {/* This Week Widget */}
          <div className="today-side-widget">
            <h3 className="today-side-widget-title">This week</h3>
            <p className="today-side-widget-body">
              Reflect on everyday moments and shared play from this week.
            </p>
            <Button variant="secondary" onClick={() => navigate("/this-week")}>
              View reflection
            </Button>
          </div>

          {/* Milestones to Notice Widget */}
          <div className="today-side-widget">
            <h3 className="today-side-widget-title">Milestones to notice</h3>
            <p className="today-side-widget-body">
              Everyday cues to notice for {nickname}:
            </p>
            <ul className="today-milestones-list">
              <li className="today-milestone-cue">
                <span aria-hidden="true">👀</span>
                <span>Explores toys by banging, shaking, or dropping</span>
              </li>
              <li className="today-milestone-cue">
                <span aria-hidden="true">👀</span>
                <span>Points to show you something interesting</span>
              </li>
              <li className="today-milestone-cue">
                <span aria-hidden="true">👀</span>
                <span>Copies actions like waving goodbye or clapping</span>
              </li>
            </ul>
            <Button
              variant="secondary"
              onClick={() => navigate("/milestones")}
              style={{ marginTop: "var(--space-4)" }}
            >
              View milestones
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
