import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Chip,
  EmptyState,
  InlineAlert,
  SessionExpiredAlert,
  Skeleton,
  UndoToast,
} from "../../../components/common";
import { ScreenHeader } from "../../../components/layout";
import { useWeather } from "../../../services/weather";
import { NonDiagnosticNotice } from "../../children/components/NonDiagnosticNotice";
import type { AgeBand } from "../../children/types";
import { useChild } from "../../children/useChild";
import { HISTORY_LIMIT, useToday } from "../hooks/useToday";
import { localDate, matchesFilters, QUICK_FILTERS } from "../logic";
import type { QuickFilter } from "../types";
import { PlanCard } from "./PlanCard";
import { TodaySideWidgets } from "./TodaySideWidgets";
import { TodayWeatherBanner } from "./TodayWeatherBanner";

const SEEN_KEY = "ls.advisorySeen"; // boolean preference flag only, no child data

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

/** Today screen: the selected child's plan, quick filters, mark complete, weather hint, and history. */
export function TodayScreen() {
  const { activeChild } = useChild();
  const [showAdvisory, setShowAdvisory] = useState(() => !readSeen());

  const hideAdvisory = () => {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* private browsing: notice shows again on next visit */
    }
    setShowAdvisory(false);
  };

  return (
    <section className="screen today-screen" aria-labelledby="today-title">
      <ScreenHeader
        id="today-title"
        title="Today"
        subtitle={
          activeChild
            ? `${getTimeGreeting()}! Here's ${activeChild.nickname}'s play plan for today.`
            : "Your plan for today."
        }
      />
      {showAdvisory ? (
        <NonDiagnosticNotice
          action={
            <Button variant="secondary" onClick={hideAdvisory}>
              Hide this notice
            </Button>
          }
        />
      ) : (
        <Button
          variant="text"
          className="today-advisory-btn"
          onClick={() => setShowAdvisory(true)}
        >
          Not a diagnostic tool
        </Button>
      )}
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
  ageBand: AgeBand;
}) {
  const [today, setToday] = useState(localDate);
  const { load, reload, busyIds, settled, problem, toast, markComplete, undo, closeToast } =
    useToday(childId, today);
  const { weather } = useWeather();
  const root = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [filters, setFilters] = useState<QuickFilter[]>([]);
  const navigate = useNavigate();

  // Refresh the local date if the caregiver leaves the tab open overnight.
  useEffect(() => {
    const check = () => setToday(localDate());
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);

  // Move focus cleanly when completing a plan removes the pressed card's button.
  useEffect(() => {
    if (settled.n === 0) return;
    const active = document.activeElement;
    const card = root.current?.querySelector(`[data-plan-id="${settled.planId}"]`);
    if (active && active !== document.body && !card?.contains(active)) return;
    const target =
      root.current?.querySelector<HTMLElement>(".plan-toast button, .plan-problem button") ??
      heading.current;
    target?.focus();
  }, [settled]);

  const toggle = (id: QuickFilter) =>
    setFilters((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  if (load.status === "loading") {
    return (
      <div className="plan-list" aria-busy="true">
        <Skeleton kind="card" label={`Loading ${nickname}'s plan…`} />
        <Skeleton kind="card" label="Loading activities" />
      </div>
    );
  }
  if (load.status === "unauthorized") {
    return <SessionExpiredAlert />;
  }
  if (load.status !== "ready") {
    const offline = load.status === "offline";
    return (
      <InlineAlert
        kind={offline ? "offline" : "error"}
        title={offline ? "You're offline." : "We couldn't reach LittleSteps."}
        action={
          <Button variant="secondary" onClick={reload}>
            Retry
          </Button>
        }
      >
        {offline
          ? `We can't load ${nickname}'s plan right now. Reconnect and try again.`
          : "Try again. Your saved notes are safe."}
      </InlineAlert>
    );
  }

  const { plans, history, activities } = load;
  const shown = plans.filter((p) => matchesFilters(activities[p.activityId], filters));
  const showWeatherBanner = Boolean(
    weather && (weather.hint || (weather.condition && weather.condition !== "unavailable"))
  );

  return (
    <div className="plan-root" ref={root}>
      {showWeatherBanner && weather && (
        <TodayWeatherBanner
          weather={weather}
          onFindIdeas={(presetSetting) => navigate("/explore", { state: { presetSetting } })}
        />
      )}

      <div className="today-grid">
        <div className="today-main-col">
          {problem && (
            <div className="plan-problem">
              <InlineAlert
                kind={problem.kind === "offline" ? "offline" : "error"}
                title={problem.message}
                action={
                  problem.retry && (
                    <Button variant="secondary" onClick={problem.retry}>
                      Retry
                    </Button>
                  )
                }
              />
            </div>
          )}

          <section className="plan-section" aria-labelledby="plan-heading">
            <h2 id="plan-heading" className="plan-heading" tabIndex={-1} ref={heading}>
              {nickname}&apos;s plan for today
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
                action={
                  <Button variant="secondary" onClick={() => navigate("/explore")}>
                    Find an idea
                  </Button>
                }
              >
                <p>Want a quick idea? Most take 10 minutes or less.</p>
              </EmptyState>
            ) : shown.length === 0 ? (
              <EmptyState
                title="No planned activities match these filters."
                action={
                  <Button variant="secondary" onClick={() => setFilters([])}>
                    Clear filters
                  </Button>
                }
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
            <h2 id="history-heading" className="plan-heading">
              History
            </h2>
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

        <TodaySideWidgets
          nickname={nickname}
          ageBand={ageBand}
          hasPlans={plans.length > 0}
          onExplore={() => navigate("/explore")}
          onThisWeek={() => navigate("/this-week")}
          onMilestones={() => navigate("/milestones")}
        />
      </div>
    </div>
  );
}
