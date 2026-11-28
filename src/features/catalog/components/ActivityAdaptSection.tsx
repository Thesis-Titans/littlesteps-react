import { useState } from "react";
import { Badge, Button, FilterChips, Icon, InlineAlert, TextField } from "../../../components/common";
import { NON_DIAGNOSTIC_PLAY_DISCLAIMER } from "../../../config/externalLinks";
import { adaptActivity } from "../../ai/api";
import type { ActivityAdjustment, AdaptActivityResponse } from "../../ai/types";
import { normalizeMaterials } from "../materials";
import type { CatalogActivity } from "../types";

const ADJUSTMENT_CHOICES: { id: ActivityAdjustment; label: string }[] = [
  { id: "shorter", label: "Shorter (5–10 min)" },
  { id: "easier", label: "Easier demonstration" },
  { id: "harder", label: "Extra challenge" },
  { id: "missing_material", label: "Missing a material" },
];

export interface ActivityAdaptSectionProps {
  activity: CatalogActivity;
  /** Whether the adaptation selector starts expanded without requiring an extra click. */
  initialOpen?: boolean;
  onPlan?: (activity: CatalogActivity) => void;
}

/**
 * Interactive activity adaptation form and result panel rendered inside `ActivityDetailModal`.
 */
export function ActivityAdaptSection({
  activity,
  initialOpen = false,
  onPlan,
}: ActivityAdaptSectionProps) {
  const [isAdapting, setIsAdapting] = useState(initialOpen);
  const [adjustment, setAdjustment] = useState<ActivityAdjustment>("shorter");
  const [missingMaterial, setMissingMaterial] = useState("");
  const [isAdaptLoading, setIsAdaptLoading] = useState(false);
  const [adaptError, setAdaptError] = useState<string | null>(null);
  const [adaptedResponse, setAdaptedResponse] = useState<AdaptActivityResponse | null>(null);

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
    const { adapted } = adaptedResponse;
    const duration =
      adapted.durationMinutes ?? (adjustment === "shorter" ? 5 : activity.durationMinutes);
    const title = adapted.adaptedTitle || adapted.title || activity.title;

    onPlan({
      ...activity,
      title,
      durationMinutes: duration,
      durationEstimate: `${duration} min`,
      materials: adapted.materials,
      instructions: adapted.instructions,
    });
  };

  return (
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
            Choose how you&apos;d like to adjust this for your child, time, or supplies:
          </p>
          <FilterChips
            ariaLabel="Adjustment type"
            options={ADJUSTMENT_CHOICES}
            selected={adjustment}
            onToggle={setAdjustment}
            className="catalog-adapt-chips"
          />

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
              disabled={
                isAdaptLoading || (adjustment === "missing_material" && !missingMaterial.trim())
              }
            >
              {isAdaptLoading ? "Adapting…" : "Adjust activity"}
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
            {adaptedResponse.adapted.adaptedTitle || adaptedResponse.adapted.title}
          </h4>

          <div className="catalog-adapted-why">
            <strong>Why it works:</strong>{" "}
            {adaptedResponse.adapted.explanation || adaptedResponse.adapted.whyItWorks}
          </div>

          {adaptedResponse.adapted.safetyNotice && (
            <div className="catalog-adapted-safety">
              <Icon name="info" size={16} />
              <span>{adaptedResponse.adapted.safetyNotice}</span>
            </div>
          )}

          {(() => {
            const adaptedMaterials = normalizeMaterials(adaptedResponse.adapted.materials);
            return adaptedMaterials.length > 0 ? (
              <div className="catalog-detail-section">
                <span className="catalog-spec-label">Materials:</span>
                <ul className="catalog-materials-list">
                  {adaptedMaterials.map((mat) => (
                    <li key={mat}>{mat}</li>
                  ))}
                </ul>
              </div>
            ) : null;
          })()}

          <div className="catalog-detail-section">
            <span className="catalog-spec-label">Adjusted steps:</span>
            <ol className="catalog-instructions-list">
              {adaptedResponse.adapted.instructions.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          </div>

          <p className="catalog-adapted-disclaimer">{NON_DIAGNOSTIC_PLAY_DISCLAIMER}</p>

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
  );
}
