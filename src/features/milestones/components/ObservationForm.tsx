import { useState, type FormEvent } from "react";
import { Button, ConfirmDialog, InlineAlert, Select, TextField } from "../../../components/common";
import { ApiError } from "../../../services/api";
import { failureKind } from "../../../services/offline";
import { recordObservation, updateObservation } from "../api";
import { dateProblem, todayIso } from "../logic";
import { MILESTONE_STATUSES, NOTE_MAX_LENGTH, STATUS_LABELS, type MilestoneObservation, type MilestonePrompt, type MilestoneStatus } from "../types";

type Props = {
  childId: string;
  childName: string;
  prompt: MilestonePrompt;
  existing?: MilestoneObservation;
  onSaved: (observation: MilestoneObservation) => void;
  onClose: () => void;
};

/** "Note what you saw" form. A failed save keeps everything typed and offers Retry. */
export function ObservationForm({ childId, childName, prompt, existing, onSaved, onClose }: Props) {
  const initial = { status: existing?.status ?? "observed", date: existing?.observedDate ?? todayIso(), notes: existing?.notes ?? "" };
  const [status, setStatus] = useState<MilestoneStatus>(initial.status);
  const [date, setDate] = useState(initial.date);
  const [notes, setNotes] = useState(initial.notes);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<"offline" | "error">();
  const [dateError, setDateError] = useState<string>();
  const [confirming, setConfirming] = useState(false);

  const dirty = status !== initial.status || date !== initial.date || notes !== initial.notes;
  const titleId = `observe-${prompt.id}`;

  async function save(event?: FormEvent) {
    event?.preventDefault();
    const problem = dateProblem(date);
    setDateError(problem);
    if (problem) return void document.getElementById(`${titleId}-date`)?.focus();
    setSaving(true);
    setFailure(undefined);
    const input = { status, observedDate: date, notes: notes.trim() };
    try {
      const saved = existing ? await updateObservation(childId, existing.id, input) : await recordObservation(childId, prompt.id, input);
      onSaved(saved);
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) setDateError("Choose today or an earlier date.");
      else setFailure(failureKind(error, navigator.onLine) === "offline" ? "offline" : "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="milestone-form" onSubmit={save} aria-labelledby={titleId} noValidate>
      <h3 id={titleId} className="milestone-form-title">Note what you saw for {childName}</h3>
      <p className="milestone-form-prompt">{prompt.title}</p>
      <Select
        label="What did you see?"
        value={status}
        onChange={(e) => setStatus(e.target.value as MilestoneStatus)}
        options={MILESTONE_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }))}
      />
      <TextField
        label="Date"
        type="date"
        required
        max={todayIso()}
        value={date}
        error={dateError}
        onChange={(e) => setDate(e.target.value)}
        id={`${titleId}-date`}
      />
      <TextField
        multiline
        label="Note (optional)"
        hint="Only you can see these notes. We never share them."
        maxLength={NOTE_MAX_LENGTH}
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      {failure === "offline" && (
        <InlineAlert kind="offline" title="You're offline. Your note wasn't saved." action={<Button variant="secondary" onClick={() => void save()}>Retry</Button>}>
          What you typed is still here. Reconnect and try again.
        </InlineAlert>
      )}
      {failure === "error" && (
        <InlineAlert kind="error" title="We couldn't save your note." action={<Button variant="secondary" onClick={() => void save()}>Retry</Button>}>
          What you typed is still here. Try again in a moment.
        </InlineAlert>
      )}
      <div className="milestone-form-actions">
        <Button type="submit" busy={saving}>Save note</Button>
        <Button variant="secondary" onClick={() => (dirty ? setConfirming(true) : onClose())}>Cancel</Button>
      </div>
      <ConfirmDialog open={confirming} title="Discard this note?" confirmLabel="Discard note" cancelLabel="Keep editing" destructive onConfirm={onClose} onCancel={() => setConfirming(false)}>
        What you typed will not be saved.
      </ConfirmDialog>
    </form>
  );
}
