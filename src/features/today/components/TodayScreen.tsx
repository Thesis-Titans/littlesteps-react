import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Chip, EmptyState, InlineAlert, Skeleton, UndoToast } from "../../../components/common";
import { ScreenHeader } from "../../../components/layout";
import { useChild } from "../../children/useChild";
import { NonDiagnosticNotice } from "../../children/components/NonDiagnosticNotice";
import { useToday } from "../hooks/useToday";
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

/** Today screen: the selected child's plan, quick filters, mark complete and history. */
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
    <section className="screen" aria-labelledby="today-title">
      <ScreenHeader id="today-title" title="Today" subtitle="Your plan for today." />
      {showAdvisory ? (
        <NonDiagnosticNotice action={<Button variant="secondary" onClick={hideAdvisory}>Hide this notice</Button>} />
      ) : (
        <Button variant="text" onClick={() => setShowAdvisory(true)}>Not a diagnostic tool</Button>
      )}
      {/* Keyed by child so switching children starts a fresh load. */}
      {activeChild && <TodayPlan key={activeChild.id} childId={activeChild.id} nickname={activeChild.nickname} />}
    </section>
  );
}

function TodayPlan({ childId, nickname }: { childId: string; nickname: string }) {
  const [today] = useState(localDate);
  const { load, reload, busyId, problem, toast, markComplete, undo, closeToast } = useToday(childId, today);
  const [filters, setFilters] = useState<QuickFilter[]>([]);
  const navigate = useNavigate();
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
    return <InlineAlert kind="error" title="Please sign in again.">Your session has ended. Your saved notes are safe.</InlineAlert>;
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
    <>
      {problem && (
        <InlineAlert
          kind={problem.kind === "offline" ? "offline" : "error"}
          title={problem.message}
          action={problem.retry && <Button variant="secondary" onClick={problem.retry}>Retry</Button>}
        />
      )}

      <section className="plan-section" aria-labelledby="plan-heading">
        <h2 id="plan-heading" className="plan-heading">{nickname}'s plan for today</h2>
        {plans.length > 0 && (
          <div className="plan-filters" role="group" aria-label="Quick filters">
            {QUICK_FILTERS.map((f) => (
              <Chip key={f.id} selected={filters.includes(f.id)} onClick={() => toggle(f.id)}>{f.label}</Chip>
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
          <EmptyState title="No planned activities match these filters." action={<Button variant="secondary" onClick={() => setFilters([])}>Clear filters</Button>} />
        ) : (
          <ul className="plan-list">
            {shown.map((plan) => (
              <PlanCard key={plan.id} plan={plan} activity={activities[plan.activityId]} busy={busyId === plan.id} onComplete={markComplete} />
            ))}
          </ul>
        )}
      </section>

      {toast && (
        <div className="plan-toast">
          <UndoToast message={`${activities[toast.activityId]?.title ?? "Activity"} marked complete.`} onUndo={undo} onClose={closeToast} />
        </div>
      )}

      <section className="plan-section" aria-labelledby="history-heading">
        <h2 id="history-heading" className="plan-heading">History</h2>
        {history.length === 0 ? (
          <p className="plan-card-meta">Completed activities for {nickname} will show here.</p>
        ) : (
          <ul className="plan-list">
            {history.map((plan) => (
              <PlanCard key={plan.id} plan={plan} activity={activities[plan.activityId]} showDate />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
