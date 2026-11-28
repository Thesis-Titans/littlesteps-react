import { Icon } from "../../../components/common";
import { DOMAINS, DOMAIN_DESCRIPTIONS, DOMAIN_LABELS } from "../../catalog/types";
import type { WeeklySummary } from "../types";

export interface WeeklyStatsCardsProps {
  summary: WeeklySummary;
  childNickname: string;
}

/**
 * Factual weekly summary stats, everyday play areas breakdown, and calm reflection card.
 */
export function WeeklyStatsCards({ summary, childNickname }: WeeklyStatsCardsProps) {
  return (
    <>
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

      <article className="this-week-domains-card" aria-labelledby="domains-heading">
        <h3 id="domains-heading" className="this-week-section-title">
          Everyday play areas
        </h3>

        <ul className="this-week-domains-list">
          {DOMAINS.map((domainKey) => {
            const count = summary.domainDistribution[domainKey] ?? 0;
            return (
              <li key={domainKey} className="this-week-domain-item">
                <div className="this-week-domain-header">
                  <h4 className="this-week-domain-title">{DOMAIN_LABELS[domainKey]}</h4>
                  <span className={`this-week-domain-count ${count === 0 ? "is-zero" : ""}`}>
                    {count === 0
                      ? "None this week"
                      : `${count} ${count === 1 ? "activity" : "activities"}`}
                  </span>
                </div>
                <p className="this-week-domain-desc">{DOMAIN_DESCRIPTIONS[domainKey]}</p>
              </li>
            );
          })}
        </ul>
      </article>

      <aside className="this-week-reflection-card" aria-labelledby="reflection-heading">
        <h3 id="reflection-heading" className="this-week-reflection-heading">
          <Icon name="sparkle" size={18} />
          <span>Reflections on your week</span>
        </h3>

        <p className="this-week-reflection-text">
          {summary.reflectionPrompt ||
            `You and ${childNickname} shared quiet moments and everyday play together.`}
        </p>

        <p className="this-week-reflection-note">
          <strong>It&apos;s not a test.</strong> Every child develops at their own pace. These summaries record what you shared, not what your child was expected to do.
        </p>
      </aside>
    </>
  );
}
