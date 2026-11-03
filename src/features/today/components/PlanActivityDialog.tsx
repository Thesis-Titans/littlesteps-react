import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Button, InlineAlert, TextField, useRestoreFocus } from "../../../components/common";
import type { CatalogActivity } from "../../catalog";
import { ApiError } from "../../../services/api";
import { createPlan } from "../api";
import { localDate, problemFor, validatePlanDate, type Problem } from "../logic";
import type { Plan } from "../types";

type Props = {
  activity: CatalogActivity | null;
  childId: string;
  childNickname: string;
  onClose: () => void;
  /** The control to return focus to; set when the dialog opens from another dialog that has closed. */
  returnFocusTo?: HTMLElement | null;
  /** Id of the element that gets focus if `returnFocusTo` is gone. */
  fallbackFocusId?: string;
  onPlanned: (plan: Plan, activity: CatalogActivity) => void;
};

/** Picks a date and adds one catalog activity to the active child's plan. */
export function PlanActivityDialog({ activity, ...rest }: Props) {
  // Remounting per activity resets the form without an effect.
  return activity ? <Form key={activity.id} activity={activity} {...rest} /> : null;
}

function Form({ activity, childId, childNickname, onClose, onPlanned, returnFocusTo, fallbackFocusId }: Props & { activity: CatalogActivity }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [date, setDate] = useState(localDate);
  const [dateError, setDateError] = useState<string>();
  const [problem, setProblem] = useState<Problem>();
  const [busy, setBusy] = useState(false);

  useRestoreFocus(true, returnFocusTo, fallbackFocusId);
  useEffect(() => {
    const el = dialog.current;
    if (el && !el.open) el.showModal();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const invalid = validatePlanDate(date);
    setDateError(invalid);
    setProblem(undefined);
    if (invalid) return;
    setBusy(true);
    try {
      onPlanned(await createPlan(childId, { activityId: activity.id, scheduledDate: date }), activity);
    } catch (error) {
      const serverDate = error instanceof ApiError && error.status === 400 ? error.details.find((d) => d.field === "scheduledDate") : undefined;
      if (serverDate) setDateError(serverDate.issue);
      else setProblem(problemFor(error, "added to the plan"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog
      ref={dialog}
      className="ls-dialog plan-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <form onSubmit={submit} noValidate>
        <h2 id={titleId} className="plan-dialog-title">Add to {childNickname}'s plan</h2>
        <p className="plan-card-meta">{activity.title}</p>
        <TextField label="Date" type="date" value={date} error={dateError} onChange={(e) => setDate(e.target.value)} required />
        {problem && (
          <InlineAlert kind={problem.kind === "offline" ? "offline" : "error"} title={problem.message} />
        )}
        <div className="ls-dialog-actions">
          <Button variant="text" onClick={onClose}>Cancel</Button>
          <Button type="submit" busy={busy}>Add to plan</Button>
        </div>
      </form>
    </dialog>
  );
}
