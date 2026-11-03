import { Button, Card, Icon } from "../../../components/common";
import { ageBandLabel } from "../../children/types";
import { DOMAIN_LABELS, SETTING_LABELS, type CatalogActivity } from "../types";

type ActivityCardProps = {
  activity: CatalogActivity;
  /** `opener` is the button pressed, so focus can return to it later. */
  onSelect: (activity: CatalogActivity, opener: HTMLElement) => void;
};

export function ActivityCard({ activity, onSelect }: ActivityCardProps) {
  const domainLabel = DOMAIN_LABELS[activity.domain] ?? activity.domain;
  const settingLabel = SETTING_LABELS[activity.setting] ?? activity.setting;
  const ageLabel = ageBandLabel(activity.ageBand);

  return (
    <Card as="article" elevated className="catalog-activity-card">
      <div className="catalog-activity-header">
        <span className={`catalog-domain-tag catalog-domain-${activity.domain}`}>
          {domainLabel}
        </span>
        <span className="catalog-meta-item catalog-time-item">
          <Icon name="clock" size={16} />
          {activity.durationEstimate || `${activity.durationMinutes} min`}
        </span>
      </div>

      <h3 className="catalog-activity-title">{activity.title}</h3>

      <div className="catalog-activity-meta">
        <span className="catalog-meta-item">{ageLabel}</span>
        <span className="catalog-meta-bullet" aria-hidden="true">·</span>
        <span className="catalog-meta-item">{settingLabel}</span>
      </div>

      {activity.materials.length > 0 && (
        <div className="catalog-materials-row" aria-label="Materials needed">
          {activity.materials.map((material) => (
            <span key={material} className="catalog-material-pill">
              {material}
            </span>
          ))}
        </div>
      )}

      <p className="catalog-activity-source">
        <Icon name="info" size={16} />
        {activity.provenanceSource || "Source: early learning guide · still being checked"}
      </p>

      <div className="catalog-activity-actions">
        <Button
          variant="secondary"
          fullWidth
          onClick={(event) => onSelect(activity, event.currentTarget)}
        >
          View activity{" "}<span className="ls-visually-hidden">for {activity.title}</span>
        </Button>
      </div>
    </Card>
  );
}
