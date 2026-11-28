import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  EmptyState,
  InlineAlert,
  SessionExpiredAlert,
  Skeleton,
} from "../../components/common";
import { ScreenHeader } from "../../components/layout";
import { useChild } from "../children/useChild";
import { WeeklyStatsCards } from "./components/WeeklyStatsCards";
import { currentIsoWeek, formatWeekRange, isoWeekBounds, shiftIsoWeek } from "./logic";
import { useWeeklySummary } from "./useWeeklySummary";

/** Weekly reflection screen summarizing completed play activities and noticed milestones. */
export function ThisWeekScreen() {
  const { activeChild } = useChild();

  if (!activeChild) {
    return (
      <section className="screen" aria-labelledby="this-week-title">
        <ScreenHeader
          id="this-week-title"
          title="This week"
          subtitle="Reflect on everyday moments and shared play."
        />
        <EmptyState title="No child profile selected">
          <p>Please select or add a child profile to view weekly reflections.</p>
        </EmptyState>
      </section>
    );
  }

  return (
    <ActiveChildThisWeek
      key={activeChild.id}
      childId={activeChild.id}
      childNickname={activeChild.nickname}
    />
  );
}

function ActiveChildThisWeek({
  childId,
  childNickname,
}: {
  childId: string;
  childNickname: string;
}) {
  const navigate = useNavigate();
  const [selectedWeek, setSelectedWeek] = useState(() => currentIsoWeek());
  const { status, summary, reload } = useWeeklySummary(childId, { week: selectedWeek });

  const bounds = isoWeekBounds(selectedWeek);
  const weekRangeLabel = formatWeekRange(bounds.weekStart, bounds.weekEnd);
  const isCurrentWeek = selectedWeek === currentIsoWeek();

  const isEmptyWeek =
    status === "ready" &&
    summary &&
    summary.completedActivityCount === 0 &&
    summary.observedMilestoneCount === 0;

  return (
    <section className="screen this-week-screen" aria-labelledby="this-week-title">
      <ScreenHeader
        id="this-week-title"
        title="This week"
        subtitle={`Factual reflection on activities and observations with ${childNickname}.`}
      />

      <nav className="this-week-nav-bar" aria-label="Week navigation">
        <Button
          variant="secondary"
          onClick={() => setSelectedWeek((prev) => shiftIsoWeek(prev, -1))}
          aria-label="Previous week"
        >
          ← Previous
        </Button>

        <div className="this-week-range-info">
          <h2 className="this-week-range-label">{weekRangeLabel}</h2>
          <span className="this-week-range-sub">
            {isCurrentWeek ? "Current week" : selectedWeek}
          </span>
        </div>

        <Button
          variant="secondary"
          onClick={() => setSelectedWeek((prev) => shiftIsoWeek(prev, 1))}
          aria-label="Next week"
        >
          Next →
        </Button>
      </nav>

      {status === "unauthorized" && <SessionExpiredAlert />}

      {status === "error" && (
        <InlineAlert
          kind="caution"
          title="Could not load weekly reflection"
          action={
            <Button variant="secondary" onClick={reload}>
              Retry
            </Button>
          }
        >
          <p>We couldn&apos;t reach LittleSteps. Please check your connection and try again.</p>
        </InlineAlert>
      )}

      {status === "offline" && (
        <InlineAlert kind="offline" title="Offline mode">
          <p>You&apos;re offline. Previously loaded reflections are shown.</p>
        </InlineAlert>
      )}

      {status === "loading" && (
        <div
          className="this-week-loading-stack"
          aria-busy="true"
          aria-label="Loading weekly summary"
        >
          <div className="this-week-stats-grid">
            <Card as="div" className="this-week-stat-card">
              <Skeleton kind="card" label="Loading completed activities…" />
            </Card>
            <Card as="div" className="this-week-stat-card">
              <Skeleton kind="card" label="Loading milestones noticed…" />
            </Card>
          </div>
          <Card as="div" className="this-week-domains-card">
            <Skeleton kind="card" label="Loading everyday play areas…" />
          </Card>
        </div>
      )}

      {isEmptyWeek && (
        <EmptyState
          title="No activities recorded this week."
          action={
            isCurrentWeek ? (
              <Button variant="secondary" onClick={() => navigate("/explore")}>
                Explore play ideas
              </Button>
            ) : undefined
          }
        >
          <p>Every week is different. There are no tests or catch-up lists.</p>
        </EmptyState>
      )}

      {status === "ready" && summary && !isEmptyWeek && (
        <WeeklyStatsCards summary={summary} childNickname={childNickname} />
      )}
    </section>
  );
}
