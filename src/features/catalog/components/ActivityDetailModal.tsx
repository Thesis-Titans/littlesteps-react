import { useEffect, useId, useRef, useState } from "react";
import { Badge, Button, Chip, Icon, InlineAlert, TextField, useRestoreFocus } from "../../../components/common";
import { ageBandLabel } from "../../children/types";
import { DOMAIN_LABELS, SETTING_LABELS, type CatalogActivity } from "../types";
import { adaptActivity } from "../../ai/api";
import type { ActivityAdjustment, AdaptActivityResponse } from "../../ai/types";

type ActivityDetailModalProps = {
  activity: CatalogActivity | null;
  childAgeMonths?: number;
  onClose: () => void;
  /** When set, shows an "Add to plan" button. */
  onPlan?: (activity: CatalogActivity) => void;
};

type ActivityDetailContentProps = {
  activity: CatalogActivity;
  childAgeMonths?: number;
  titleId: string;
  onClose: () => void;
  onPlan?: (activity: CatalogActivity) => void;
};

function ActivityDetailContent({
  activity,
  childAgeMonths: _childAgeMonths,
  titleId,
  onClose,
  onPlan,
}: ActivityDetailContentProps) {
  const [isAdapting, setIsAdapting] = useState(false);
  const [adjustment, setAdjustment] = useState<ActivityAdjustment>("shorter");
  const [missingMaterial, setMissingMaterial] = useState("");
  const [isAdaptLoading, setIsAdaptLoading] = useState(false);
  const [adaptError, setAdaptError] = useState<string | null>(null);
  const [adaptedResponse, setAdaptedResponse] = useState<AdaptActivityResponse | null>(null);

  const domainLabel = DOMAIN_LABELS[activity.domain] ?? activity.domain;
  const settingLabel = SETTING_LABELS[activity.setting] ?? activity.setting;
  const ageLabel = ageBandLabel(activity.ageBand);

  const handleAdapt = async () => {
    setIsAdaptLoading(true);
    setAdaptError(null);
    try {
      const res = await adaptActivity({
        activityId: activity.id,
        adjustment,
        missingMaterial: adjustment === "missing_material" ? missingMaterial.trim() : undefined,
        ageBand: activity.ageBand,
      });
      setAdaptedResponse(res);
    } catch {
      setAdaptError("Could not adapt this activity right now. Please try again.");
    } finally {
      setIsAdaptLoading(false);
    }
  };

  const handlePlanAdapted = () => {
    if (!onPlan || !adaptedResponse) return;
    const duration =
      (adaptedResponse.adapted as unknown as { durationMinutes?: number }).durationMinutes ??
      (adjustment === "shorter" ? 5 : activity.durationMinutes);

    const title =
      adaptedResponse.adapted.adaptedTitle ||
      (adaptedResponse.adapted as unknown as { title?: string }).title ||
      activity.title;

    const adaptedCatalogActivity: CatalogActivity = {
      ...activity,
      title,
      durationMinutes: duration,
      durationEstimate: `${duration} min`,
      materials: adaptedResponse.adapted.materials,
      instructions: adaptedResponse.adapted.instructions,
    };
    onPlan(adaptedCatalogActivity);
  };

  return (
    <>
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

        {/* Adapt this activity section (Issue #61, ADR-012) */}
        <div className="catalog-adapt-section">
          <div className="catalog-adapt-header">
            <div className="catalog-adapt-title-group">
              <Icon name="sparkle" size={18} />
              <h3 className="catalog-adapt-title">Need to adjust this activity?</h3>
            </div>
            {!isAdapting && !adaptedResponse && (
              <Button
                variant="secondary"
                onClick={() => setIsAdapting(true)}
                aria-label="Adapt this activity"
              >
                Adapt activity
              </Button>
            )}
          </div>

          {isAdapting && !adaptedResponse && (
            <div className="catalog-adapt-form">
              <p className="catalog-limitations-text">
                Choose how you'd like to adjust this for your child, time, or supplies:
              </p>
              <div className="catalog-adapt-chips" role="radiogroup" aria-label="Adjustment type">
                <Chip
                  selected={adjustment === "shorter"}
                  onClick={() => setAdjustment("shorter")}
                  aria-label="Shorter (5–10 min)"
                >
                  Shorter (5–10 min)
                </Chip>
                <Chip
                  selected={adjustment === "easier"}
                  onClick={() => setAdjustment("easier")}
                  aria-label="Easier demonstration"
                >
                  Easier demonstration
                </Chip>
                <Chip
                  selected={adjustment === "harder"}
                  onClick={() => setAdjustment("harder")}
                  aria-label="Extra challenge"
                >
                  Extra challenge
                </Chip>
                <Chip
                  selected={adjustment === "missing_material"}
                  onClick={() => setAdjustment("missing_material")}
                  aria-label="Missing a material"
                >
                  Missing a material
                </Chip>
              </div>

              {adjustment === "missing_material" && (
                <div className="catalog-adapt-missing-field">
                  <TextField
                    label="What material are you missing?"
                    placeholder="e.g. cups, wooden spoons, towel"
                    value={missingMaterial}
                    onChange={(e) => setMissingMaterial(e.target.value)}
                  />
                </div>
              )}

              {adaptError && (
                <InlineAlert kind="error" title="Adaptation unavailable">
                  {adaptError}
                </InlineAlert>
              )}

              <div className="catalog-adapt-actions">
                <Button
                  variant="primary"
                  onClick={() => void handleAdapt()}
                  disabled={isAdaptLoading || (adjustment === "missing_material" && !missingMaterial.trim())}
                >
                  {isAdaptLoading ? "Adapting…" : "Generate adaptation"}
                </Button>
                <Button
                  variant="text"
                  onClick={() => {
                    setIsAdapting(false);
                    setAdaptError(null);
                  }}
                  disabled={isAdaptLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {adaptedResponse && (
            <div className="catalog-adapted-card" aria-live="polite">
              <div className="catalog-adapted-header">
                <span className="catalog-spec-label">Adapted variation</span>
                <Badge kind="ai" />
              </div>

              <h4 className="catalog-adapted-title">
                {adaptedResponse.adapted.adaptedTitle ||
                  (adaptedResponse.adapted as unknown as { title?: string }).title}
              </h4>

              <div className="catalog-adapted-why">
                <strong>Why it works:</strong>{" "}
                {adaptedResponse.adapted.explanation ||
                  (adaptedResponse.adapted as unknown as { whyItWorks?: string }).whyItWorks}
              </div>

              {adaptedResponse.adapted.safetyNotice && (
                <div className="catalog-adapted-safety">
                  <Icon name="info" size={16} />
                  <span>{adaptedResponse.adapted.safetyNotice}</span>
                </div>
              )}

              {adaptedResponse.adapted.materials.length > 0 && (
                <div className="catalog-detail-section">
                  <span className="catalog-spec-label">Materials:</span>
                  <ul className="catalog-materials-list">
                    {adaptedResponse.adapted.materials.map((mat) => (
                      <li key={mat}>{mat}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="catalog-detail-section">
                <span className="catalog-spec-label">Adjusted steps:</span>
                <ol className="catalog-instructions-list">
                  {adaptedResponse.adapted.instructions.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>

              <p className="catalog-adapted-disclaimer">
                Observational play suggestion only. Not developmental assessment.
              </p>

              <div className="catalog-adapted-buttons">
                {onPlan && (
                  <Button variant="primary" onClick={handlePlanAdapted}>
                    Add adapted activity to plan
                  </Button>
                )}
                <Button
                  variant="secondary"
                  onClick={() => {
                    setAdaptedResponse(null);
                    setIsAdapting(true);
                  }}
                >
                  Try another adjustment
                </Button>
              </div>
            </div>
          )}
        </div>

        <p className="catalog-detail-source">
          <Icon name="info" size={16} />
          {activity.provenanceSource || "Source: early learning guide · still being checked"}
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
    </>
  );
}

export function ActivityDetailModal({
  activity,
  childAgeMonths,
  onClose,
  onPlan,
}: ActivityDetailModalProps) {
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
      <ActivityDetailContent
        key={activity.id}
        activity={activity}
        childAgeMonths={childAgeMonths}
        titleId={titleId}
        onClose={onClose}
        onPlan={onPlan}
      />
    </dialog>
  );
}
