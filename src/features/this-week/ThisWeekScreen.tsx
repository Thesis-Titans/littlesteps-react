import { useState } from "react";
import {
  Button,
  Card,
  EmptyState,
  InlineAlert,
  Skeleton,
} from "../../components/common";
import { ScreenHeader } from "../../components/layout";
import { useChild } from "../children/useChild";
import {
  DOMAIN_DESCRIPTIONS,
  DOMAIN_LABELS,
  currentIsoWeek,
  formatWeekRange,
  isoWeekBounds,
  shiftIsoWeek,
} from "./logic";
import { useWeeklySummary } from "./useWeeklySummary";

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

  return <ActiveChildThisWeek childId={activeChild.id} childNickname={activeChild.nickname} />;
}

function ActiveChildThisWeek({
  childId,
  childNickname,
}: {
  childId: string;
  childNickname: string;
}) {
  const [selectedWeek, setSelectedWeek] = useState(() => currentIsoWeek());
  const { status, summary, reload } = useWeeklySummary(childId, { week: selectedWeek });

  const bounds = isoWeekBounds(selectedWeek);
  const weekRangeLabel = formatWeekRange(bounds.weekStart, bounds.weekEnd);
  const isCurrentWeek = selectedWeek === currentIsoWeek();

  function handlePrevWeek() {
    setSelectedWeek((prev) => shiftIsoWeek(prev, -1));
  }

  function handleNextWeek() {
    setSelectedWeek((prev) => shiftIsoWeek(prev, 1));
  }

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

      {/* Week Selector Bar */}
      <nav className="this-week-nav-bar" aria-label="Week navigation">
        <Button
          variant="secondary"
          onClick={handlePrevWeek}
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
          onClick={handleNextWeek}
          aria-label="Next week"
        >
          Next →
        </Button>
      </nav>

      {/* 5-State Status Banners */}
      {status === "error" && (
        <InlineAlert kind="caution" title="Could not load weekly reflection">
          <p>We couldn't reach LittleSteps. Please check your connection and try again.</p>
          <Button variant="secondary" onClick={reload} style={{ marginTop: "var(--space-8)" }}>
            Retry
          </Button>
        </InlineAlert>
      )}

      {status === "offline" && (
        <InlineAlert kind="info" title="Offline mode">
          <p>You're offline. Previously loaded reflections are shown.</p>
        </InlineAlert>
      )}

      {/* Loading Skeletons */}
      {status === "loading" && (
        <div aria-busy="true" aria-label="Loading weekly summary" style={{ width: "100%", display: "flex", flexDirection: "column", gap: "var(--space-16)" }}>
          <div className="this-week-stats-grid">
            <Card as="div" className="this-week-stat-card">
              <Skeleton height="36px" width="60px" />
              <Skeleton height="20px" width="140px" />
            </Card>
            <Card as="div" className="this-week-stat-card">
              <Skeleton height="36px" width="60px" />
              <Skeleton height="20px" width="140px" />
            </Card>
          </div>
          <Card as="div" className="this-week-domains-card">
            <Skeleton height="24px" width="180px" />
            <Skeleton height="60px" width="100%" />
            <Skeleton height="60px" width="100%" />
          </Card>
        </div>
      )}

      {/* Empty Week State */}
      {isEmptyWeek && (
        <EmptyState
          title="No activities recorded this week."
          action={
            isCurrentWeek ? (
              <Button
                variant="secondary"
                onClick={() => {
                  window.location.hash = "#/explore";
                }}
              >
                Explore play ideas
              </Button>
            ) : undefined
          }
        >
          <p>Every week is different. There are no tests or catch-up lists.</p>
        </EmptyState>
      )}

      {/* Content Ready */}
      {status === "ready" && summary && !isEmptyWeek && (
        <>
          {/* Stats Cards */}
          <div className="this-week-stats-grid">
            <article className="this-week-stat-card" aria-label="Activities completed">
              <span className="this-week-stat-num">{summary.completedActivityCount}</span>
              <h3 className="this-week-stat-label">Completed activities</h3>
              <p className="this-week-stat-meta">Shared everyday play moments</p>
            </article>

            <article className="this-week-stat-card" aria-label="Milestones observed">
              <span className="this-week-stat-num">{summary.observedMilestoneCount}</span>
              <h3 className="this-week-stat-label">Milestones noticed</h3>
              <p className="this-week-stat-meta">Observed during everyday routines</p>
            </article>
          </div>

          {/* Developmental Domains Breakdown */}
          <article className="this-week-domains-card" aria-labelledby="domains-heading">
            <h3 id="domains-heading" className="this-week-section-title">
              Everyday play areas
            </h3>

            <ul className="this-week-domains-list">
              {(["cognitive", "motor", "language", "socioEmotional"] as const).map(
                (domainKey) => {
                  const count = summary.domainDistribution[domainKey] ?? 0;
                  const label = DOMAIN_LABELS[domainKey] || domainKey;
                  const desc = DOMAIN_DESCRIPTIONS[domainKey] || "";

                  return (
                    <li key={domainKey} className="this-week-domain-item">
                      <div className="this-week-domain-header">
                        <h4 className="this-week-domain-title">{label}</h4>
                        <span
                          className={`this-week-domain-count ${count === 0 ? "is-zero" : ""}`}
                        >
                          {count === 0
                            ? "None this week"
                            : `${count} ${count === 1 ? "activity" : "activities"}`}
                        </span>
                      </div>
                      <p className="this-week-domain-desc">{desc}</p>
                    </li>
                  );
                }
              )}
            </ul>
          </article>

          {/* Factual Non-diagnostic Reflection Card */}
          <aside className="this-week-reflection-card" aria-labelledby="reflection-heading">
            <h3 id="reflection-heading" className="this-week-reflection-heading">
              <span>🌿</span>
              <span>Reflections on your week</span>
            </h3>

            <p className="this-week-reflection-text">
              {summary.reflectionPrompt ||
                `You and ${childNickname} shared quiet moments and everyday play together.`}
            </p>

            <p className="this-week-reflection-note">
              <strong>It's not a test.</strong> Every child develops at their own pace. These summaries record what you shared, not what your child was expected to do.
            </p>
          </aside>
        </>
      )}
    </section>
  );
}
