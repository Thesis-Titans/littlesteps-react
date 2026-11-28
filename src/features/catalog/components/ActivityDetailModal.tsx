import { useId } from "react";
import { Button, Icon, ModalDialog } from "../../../components/common";
import { DEFAULT_SOURCE_ATTRIBUTION } from "../../../config/externalLinks";
import { ageBandLabel } from "../../children/types";
import { normalizeMaterials } from "../materials";
import { DOMAIN_LABELS, SETTING_LABELS, type CatalogActivity } from "../types";
import { ActivityAdaptSection } from "./ActivityAdaptSection";

export interface ActivityDetailModalProps {
  activity: CatalogActivity | null;
  childAgeMonths?: number;
  /** Opens the modal with activity adaptation choices already expanded. */
  initialAdaptOpen?: boolean;
  onClose: () => void;
  /** When set, shows an "Add to plan" button. */
  onPlan?: (activity: CatalogActivity) => void;
}

/**
 * Modal displaying full instructions, materials, provenance, and AI adaptation controls for an activity.
 */
export function ActivityDetailModal({
  activity,
  initialAdaptOpen = false,
  onClose,
  onPlan,
}: ActivityDetailModalProps) {
  const titleId = useId();

  if (!activity) return null;

  const domainLabel = DOMAIN_LABELS[activity.domain] ?? activity.domain;
  const settingLabel = SETTING_LABELS[activity.setting] ?? activity.setting;
  const ageLabel = ageBandLabel(activity.ageBand);
  const materials = normalizeMaterials(activity.materials);

  return (
    <ModalDialog
      open
      labelledBy={titleId}
      className="catalog-detail-dialog"
      onClose={onClose}
    >
      <div className="catalog-detail-header">
        <div>
          <span className={`catalog-domain-tag catalog-domain-${activity.domain}`}>
            {domainLabel}
          </span>
          <h2 id={titleId} className="catalog-detail-title">
            {activity.title}
          </h2>
        </div>
        <Button
          variant="text"
          onClick={onClose}
          aria-label="Close activity details"
          className="catalog-close-button"
        >
          <Icon name="close" size={24} />
        </Button>
      </div>

      <div className="catalog-detail-body">
        <div className="catalog-detail-specs">
          <div className="catalog-spec-item">
            <span className="catalog-spec-label">Child&apos;s age</span>
            <span className="catalog-spec-value">{ageLabel}</span>
          </div>
          <div className="catalog-spec-item">
            <span className="catalog-spec-label">Time</span>
            <span className="catalog-spec-value">
              {activity.durationEstimate || `${activity.durationMinutes} min`}
            </span>
          </div>
          <div className="catalog-spec-item">
            <span className="catalog-spec-label">Place</span>
            <span className="catalog-spec-value">{settingLabel}</span>
          </div>
        </div>

        <div className="catalog-detail-section">
          <h3 className="catalog-section-title">Materials needed</h3>
          {materials.length > 0 ? (
            <ul className="catalog-materials-list">
              {materials.map((mat) => (
                <li key={mat}>{mat}</li>
              ))}
            </ul>
          ) : (
            <p className="catalog-limitations-text">No materials needed.</p>
          )}
        </div>

        <div className="catalog-detail-section">
          <h3 className="catalog-section-title">Steps to play</h3>
          <ol className="catalog-instructions-list">
            {activity.instructions.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </div>

        {activity.limitations && (
          <div className="catalog-detail-section catalog-limitations-section">
            <h3 className="catalog-section-title">Good to remember</h3>
            <p className="catalog-limitations-text">{activity.limitations}</p>
          </div>
        )}

        <ActivityAdaptSection
          key={`${activity.id}-${initialAdaptOpen ? "adapt" : "view"}`}
          activity={activity}
          initialOpen={initialAdaptOpen}
          onPlan={onPlan}
        />

        <p className="catalog-detail-source">
          <Icon name="info" size={16} />
          {activity.provenanceSource || DEFAULT_SOURCE_ATTRIBUTION}
        </p>
      </div>

      <div className="catalog-detail-actions">
        {onPlan && (
          <Button variant="primary" onClick={() => onPlan(activity)}>
            Add to plan
          </Button>
        )}
        <Button variant={onPlan ? "secondary" : "primary"} onClick={onClose}>
          Close
        </Button>
      </div>
    </ModalDialog>
  );
}
