import { Button, Card, Icon } from "../../../components/common";
import { DEFAULT_SOURCE_ATTRIBUTION } from "../../../config/externalLinks";
import { ageBandLabel } from "../../children/types";
import { normalizeMaterials } from "../materials";
import { DOMAIN_LABELS, SETTING_LABELS, type CatalogActivity } from "../types";

type ActivityCardProps = {
  activity: CatalogActivity;
  /** `opener` is the button pressed so focus can return cleanly when dialogs close. */
  onSelect: (activity: CatalogActivity, opener: HTMLElement) => void;
  /** Optional shortcut opening the detail dialog with adaptation controls already expanded. */
  onAdapt?: (activity: CatalogActivity, opener: HTMLElement) => void;
};

/** Card summarizing a catalog play activity with materials, provenance, and quick actions. */
export function ActivityCard({ activity, onSelect, onAdapt }: ActivityCardProps) {
  const domainLabel = DOMAIN_LABELS[activity.domain] ?? activity.domain;
  const settingLabel = SETTING_LABELS[activity.setting] ?? activity.setting;
  const ageLabel = ageBandLabel(activity.ageBand);
  const materials = normalizeMaterials(activity.materials);

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

      <div className="catalog-materials-row" aria-label="Materials needed">
        {materials.length > 0 ? (
          materials.map((material) => (
            <span key={material} className="catalog-material-pill">
              {material}
            </span>
          ))
        ) : (
          <span className="catalog-material-pill">No materials needed</span>
        )}
      </div>

      <p className="catalog-activity-source">
        <Icon name="info" size={16} />
        {activity.provenanceSource || DEFAULT_SOURCE_ATTRIBUTION}
      </p>

      <div className="catalog-activity-actions">
        <Button
          variant="secondary"
          className="catalog-activity-view-btn"
          onClick={(event) => onSelect(activity, event.currentTarget)}
        >
          View activity{" "}<span className="ls-visually-hidden">for {activity.title}</span>
        </Button>
        {onAdapt && (
          <Button
            variant="secondary"
            aria-label={`Adapt ${activity.title}`}
            onClick={(event) => onAdapt(activity, event.currentTarget)}
          >
            <Icon name="sparkle" size={16} />
            Adapt
          </Button>
        )}
      </div>
    </Card>
  );
}
