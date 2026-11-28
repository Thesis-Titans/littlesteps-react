import { Badge, Button, Icon } from "../../../components/common";
import { normalizeMaterials } from "../../catalog/materials";
import { DOMAIN_LABELS, SETTING_LABELS, type CatalogActivity } from "../../catalog/types";
import { ageBandLabel } from "../../children/types";
import type { Suggestion } from "../types";

export interface IdeaSuggestionCardProps {
  suggestion: Suggestion;
  /** Whether this suggestion came from custom material adaptation (`source: "ai_custom"`). */
  isCustom?: boolean;
  onPlanActivity?: (activity: CatalogActivity) => void;
  onSelectActivity?: (activityId: string) => void;
}

/**
 * Displays a single play recommendation with rationale, materials, steps, and plan action.
 */
export function IdeaSuggestionCard({
  suggestion,
  isCustom = false,
  onPlanActivity,
  onSelectActivity,
}: IdeaSuggestionCardProps) {
  const { activity } = suggestion;
  const materials = normalizeMaterials(activity.materials);
  const showCustomBadge = isCustom || Boolean(suggestion.isCustom);

  return (
    <article className="idea-suggestion-card">
      <div className="idea-suggestion-header">
        <div className="idea-suggestion-tags">
          <span className={`catalog-domain-tag catalog-domain-${activity.domain}`}>
            {DOMAIN_LABELS[activity.domain]}
          </span>
          {showCustomBadge && <Badge kind="ai">Material adaptation</Badge>}
        </div>
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

      <div className="idea-suggestion-materials">
        <span className="idea-materials-label">Materials:</span>{" "}
        {materials.length > 0 ? materials.join(", ") : "No materials needed"}
      </div>

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
        {onSelectActivity && !showCustomBadge && (
          <Button variant="secondary" onClick={() => onSelectActivity(suggestion.activityId)}>
            View activity
          </Button>
        )}
      </div>
    </article>
  );
}
