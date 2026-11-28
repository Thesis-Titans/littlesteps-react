import { useId, useState, type FormEvent } from "react";
import { Button, InlineAlert, ModalDialog, TextField } from "../../../components/common";
import { ApiError } from "../../../services/api";
import type { CatalogActivity } from "../../catalog";
import { createPlan } from "../api";
import { localDate, problemFor, savePlannedActivity, validatePlanDate, type Problem } from "../logic";
import type { Plan } from "../types";

type Props = {
  activity: CatalogActivity | null;
  childId: string;
  childNickname: string;
  onClose: () => void;
  /** Control to return focus to when opened from another dialog that closed. */
  returnFocusTo?: HTMLElement | null;
  /** Element id to focus if `returnFocusTo` is gone. */
  fallbackFocusId?: string;
  onPlanned: (plan: Plan, activity: CatalogActivity) => void;
};

/** Picks a date and adds one catalog activity to the active child's plan. */
export function PlanActivityDialog({ activity, ...rest }: Props) {
  return activity ? <PlanActivityForm key={activity.id} activity={activity} {...rest} /> : null;
}

function PlanActivityForm({
  activity,
  childId,
  childNickname,
  onClose,
  onPlanned,
  returnFocusTo,
  fallbackFocusId,
}: Props & { activity: CatalogActivity }) {
  const titleId = useId();
  const [date, setDate] = useState(localDate);
  const [dateError, setDateError] = useState<string>();
  const [problem, setProblem] = useState<Problem>();
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const invalid = validatePlanDate(date);
    setDateError(invalid);
    setProblem(undefined);
    if (invalid) return;
    setBusy(true);
    try {
      const plan = await createPlan(childId, { activityId: activity.id, scheduledDate: date });
      savePlannedActivity(activity);
      onPlanned(plan, activity);
    } catch (error) {
      const serverDate =
        error instanceof ApiError && error.status === 400
          ? error.details.find((d) => d.field === "scheduledDate")
          : undefined;
      if (serverDate) setDateError(serverDate.issue);
      else setProblem(problemFor(error, "added to the plan"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalDialog
      open
      labelledBy={titleId}
      className="plan-dialog"
      returnFocusTo={returnFocusTo}
      fallbackFocusId={fallbackFocusId}
      onClose={onClose}
    >
      <form onSubmit={(e) => void submit(e)} noValidate>
        <h2 id={titleId} className="plan-dialog-title">
          Add to {childNickname}&apos;s plan
        </h2>
        <p className="plan-card-meta">{activity.title}</p>
        <TextField
          label="Date"
          type="date"
          value={date}
          error={dateError}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        {problem && (
          <InlineAlert
            kind={problem.kind === "offline" ? "offline" : "error"}
            title={problem.message}
          />
        )}
        <div className="ls-dialog-actions">
          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" busy={busy}>
            Add to plan
          </Button>
        </div>
      </form>
    </ModalDialog>
  );
}
