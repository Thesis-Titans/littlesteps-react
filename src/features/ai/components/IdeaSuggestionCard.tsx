import { Button, Icon } from "../../../components/common";
import { ageBandLabel } from "../../children/types";
import { DOMAIN_LABELS, SETTING_LABELS, type CatalogActivity } from "../../catalog/types";
import type { Suggestion } from "../types";

export interface IdeaSuggestionCardProps {
  suggestion: Suggestion;
  onPlanActivity?: (activity: CatalogActivity) => void;
  onSelectActivity?: (activityId: string) => void;
}

/**
 * Displays a single play recommendation with rationale, materials, steps, and plan action.
 */
export function IdeaSuggestionCard({
  suggestion,
  onPlanActivity,
  onSelectActivity,
}: IdeaSuggestionCardProps) {
  const { activity } = suggestion;

  return (
    <article className="idea-suggestion-card">
      <div className="idea-suggestion-header">
        <span className={`catalog-domain-tag catalog-domain-${activity.domain}`}>
          {DOMAIN_LABELS[activity.domain]}
        </span>
        <span className="catalog-meta-item">
          <Icon name="clock" size={16} />
          {activity.durationEstimate || `${activity.durationMinutes} min`}
        </span>
      </div>

      <h3 className="idea-suggestion-title">{suggestion.title}</h3>

      <p className="idea-suggestion-why">
        <strong>Why we picked it:</strong> {suggestion.whyPicked}
      </p>

      <div className="idea-suggestion-meta">
        <span>{ageBandLabel(activity.ageBand)}</span>
        <span aria-hidden="true">·</span>
        <span>{SETTING_LABELS[activity.setting]}</span>
      </div>

      {activity.materials.length > 0 && (
        <div className="idea-suggestion-materials">
          <span className="idea-materials-label">Materials:</span>{" "}
          {activity.materials.join(", ")}
        </div>
      )}

      <div className="idea-suggestion-steps">
        <h4 className="idea-steps-title">Steps to play:</h4>
        <ol className="catalog-instructions-list">
          {activity.instructions.map((step, idx) => (
            <li key={idx}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="idea-suggestion-actions">
        {onPlanActivity && (
          <Button variant="primary" onClick={() => onPlanActivity(activity)}>
            Add to plan
          </Button>
        )}
        {onSelectActivity && (
          <Button variant="secondary" onClick={() => onSelectActivity(suggestion.activityId)}>
            View activity
          </Button>
        )}
      </div>
    </article>
  );
}
