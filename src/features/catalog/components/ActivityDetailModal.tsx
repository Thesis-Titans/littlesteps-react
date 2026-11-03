import { useEffect, useId, useRef } from "react";
import { Button, Icon, useRestoreFocus } from "../../../components/common";
import { ageBandLabel } from "../../children/types";
import { DOMAIN_LABELS, SETTING_LABELS, type CatalogActivity } from "../types";

type ActivityDetailModalProps = {
  activity: CatalogActivity | null;
  onClose: () => void;
  /** When set, shows an "Add to plan" button. */
  onPlan?: (activity: CatalogActivity) => void;
};

export function ActivityDetailModal({ activity, onClose, onPlan }: ActivityDetailModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useRestoreFocus(activity !== null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (activity && !dialog.open) {
      dialog.showModal();
    } else if (!activity && dialog.open) {
      dialog.close();
    }
  }, [activity]);

  if (!activity) return null;

  const domainLabel = DOMAIN_LABELS[activity.domain] ?? activity.domain;
  const settingLabel = SETTING_LABELS[activity.setting] ?? activity.setting;
  const ageLabel = ageBandLabel(activity.ageBand);

  return (
    <dialog
      ref={dialogRef}
      className="ls-dialog catalog-detail-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
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
            <span className="catalog-spec-label">Child's age</span>
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

        {activity.materials.length > 0 && (
          <div className="catalog-detail-section">
            <h3 className="catalog-section-title">Materials needed</h3>
            <ul className="catalog-materials-list">
              {activity.materials.map((mat) => (
                <li key={mat}>{mat}</li>
              ))}
            </ul>
          </div>
        )}

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

        <p className="catalog-detail-source">
          <Icon name="info" size={16} />
          {activity.provenanceSource || "Source: early learning guide · still being checked"}
        </p>
      </div>

      <div className="catalog-detail-actions">
        {onPlan && (
          <Button variant="primary" onClick={() => onPlan(activity)} fullWidth>
            Add to plan
          </Button>
        )}
        <Button variant={onPlan ? "secondary" : "primary"} onClick={onClose} fullWidth>
          Close
        </Button>
      </div>
    </dialog>
  );
}
