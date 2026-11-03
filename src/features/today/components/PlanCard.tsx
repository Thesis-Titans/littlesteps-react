import { Badge, Button, Card, Icon } from "../../../components/common";
import { DOMAIN_LABELS, type CatalogActivity } from "../../catalog";
import { formatDate } from "../logic";
import type { Plan } from "../types";

type PlanCardProps = {
  plan: Plan;
  activity?: CatalogActivity;
  busy?: boolean;
  onComplete?: (plan: Plan) => void;
  /** History rows show the date instead of the complete button. */
  showDate?: boolean;
};

export function PlanCard({ plan, activity, busy, onComplete, showDate }: PlanCardProps) {
  const done = plan.status === "completed";
  const title = activity?.title ?? "Activity not available";
  return (
    <Card as="li" elevated className="plan-card">
      <div className="plan-card-head">
        {activity && <span className={`catalog-domain-tag catalog-domain-${activity.domain}`}>{DOMAIN_LABELS[activity.domain]}</span>}
        {activity && (
          <span className="catalog-meta-item">
            <Icon name="clock" size={16} />
            {activity.durationEstimate || `${activity.durationMinutes} min`}
          </span>
        )}
        {done && !showDate && <Badge kind="completed" />}
      </div>
      <h3 className="plan-card-title">{title}</h3>
      {showDate && <p className="plan-card-meta">Completed {formatDate(plan.scheduledDate)}</p>}
      {!activity && <p className="plan-card-meta">This activity was taken off our list.</p>}
      {activity && activity.materials.length > 0 && <p className="plan-card-meta">Materials: {activity.materials.join(", ")}</p>}
      {!done && onComplete && (
        <Button variant="secondary" busy={busy} onClick={() => onComplete(plan)} aria-label={`Mark ${title} complete`}>
          Mark complete
        </Button>
      )}
    </Card>
  );
}
