import { Button, Icon } from "../../../components/common";
import type { AgeBand } from "../../children/types";
import { promptsFor } from "../../milestones/prompts";

export interface TodaySideWidgetsProps {
  nickname: string;
  ageBand: AgeBand;
  hasPlans: boolean;
  onExplore: () => void;
  onThisWeek: () => void;
  onMilestones: () => void;
}

/**
 * Desktop sidebar shortcuts for quick play ideas, weekly reflection, and age-matched milestone cues.
 */
export function TodaySideWidgets({
  nickname,
  ageBand,
  hasPlans,
  onExplore,
  onThisWeek,
  onMilestones,
}: TodaySideWidgetsProps) {
  const ageCues = promptsFor(ageBand).slice(0, 3);

  return (
    <aside className="today-side-col" aria-label="Quick shortcuts and summaries">
      {hasPlans && (
        <div className="today-side-widget">
          <h3 className="today-side-widget-title">Need a quick idea?</h3>
          <p className="today-side-widget-body">
            Everyday play ideas for {nickname} using common household items.
          </p>
          <Button variant="secondary" onClick={onExplore}>
            Find an idea
          </Button>
        </div>
      )}

      <div className="today-side-widget">
        <h3 className="today-side-widget-title">This week</h3>
        <p className="today-side-widget-body">
          Reflect on everyday moments and shared play from this week.
        </p>
        <Button variant="secondary" onClick={onThisWeek}>
          View reflection
        </Button>
      </div>

      <div className="today-side-widget">
        <h3 className="today-side-widget-title">Milestones to notice</h3>
        <p className="today-side-widget-body">Everyday cues to notice for {nickname}:</p>
        <ul className="today-milestones-list">
          {ageCues.map((cue) => (
            <li key={cue.id} className="today-milestone-cue">
              <Icon name="eye" size={16} className="today-cue-icon" />
              <span>{cue.title}</span>
            </li>
          ))}
        </ul>
        <Button variant="secondary" onClick={onMilestones}>
          View milestones
        </Button>
      </div>
    </aside>
  );
}
