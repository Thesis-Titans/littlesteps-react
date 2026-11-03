import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button, ConfirmDialog, InlineAlert, Select, TextField } from "../../../components/common";
import { ApiError } from "../../../services/api";
import { failureKind } from "../../../services/offline";
import { recordObservation, updateObservation } from "../api";
import { FUTURE_DATE_MESSAGE, dateProblem, todayIso } from "../logic";
import { MILESTONE_STATUSES, NOTE_MAX_LENGTH, STATUS_LABELS, type MilestoneObservation, type MilestonePrompt, type MilestoneStatus } from "../types";

type Props = {
  childId: string;
  childName: string;
  prompt: MilestonePrompt;
  existing?: MilestoneObservation;
  onSaved: (observation: MilestoneObservation) => void;
  onClose: () => void;
};

/** Failures that can never succeed on retry (400, 404, 413) get their own message and no Retry button. */
function failureFor(error: unknown) {
  const kind = failureKind(error, navigator.onLine);
  if (kind !== "error") return { kind };
  const status = error instanceof ApiError ? error.status : 0;
  if (status === 404) return { kind: "rejected" as const, message: "We can't find this child's profile. Open Children to check the list." };
  if (status === 413) return { kind: "rejected" as const, message: `Notes can be up to ${NOTE_MAX_LENGTH} characters.` };
  if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
    return { kind: "rejected" as const, message: "Something in this note can't be saved. Check the date and your note." };
  }
  return { kind };
}

/** "Note what you saw" form. A failed save keeps everything typed and offers Retry. */
export function ObservationForm({ childId, childName, prompt, existing, onSaved, onClose }: Props) {
  const initial = { status: existing?.status ?? "observed", date: existing?.observedDate ?? todayIso(), notes: existing?.notes ?? "" };
  const [status, setStatus] = useState<MilestoneStatus>(initial.status);
  const [date, setDate] = useState(initial.date);
  const [notes, setNotes] = useState(initial.notes);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<{ kind: "offline" | "error" | "unauthorized" | "rejected"; message?: string }>();
  const [notesError, setNotesError] = useState<string>();
  const formRef = useRef<HTMLFormElement>(null);
  const savingRef = useRef(false);
  // Open with focus on the first field.
  useEffect(() => formRef.current?.querySelector<HTMLElement>("select, input, textarea")?.focus(), []);
  const [dateError, setDateError] = useState<string>();
  const [confirming, setConfirming] = useState(false);

  const dirty = status !== initial.status || date !== initial.date || notes !== initial.notes;
  const titleId = `observe-${prompt.id}`;

  async function save(event?: FormEvent) {
    event?.preventDefault();
    if (savingRef.current) return;
    const problem = dateProblem(date);
    const tooLong = notes.length > NOTE_MAX_LENGTH ? `Notes can be up to ${NOTE_MAX_LENGTH} characters.` : undefined;
    setDateError(problem);
    setNotesError(tooLong);
    if (problem) return void document.getElementById(`${titleId}-date`)?.focus();
    if (tooLong) return void document.getElementById(`${titleId}-notes`)?.focus();
    savingRef.current = true;
    setSaving(true);
    setFailure(undefined);
    const input = { status, observedDate: date, notes: notes.trim() };
    try {
      const saved = existing ? await updateObservation(childId, existing.id, input) : await recordObservation(childId, prompt.id, input);
      onSaved(saved);
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) setDateError(FUTURE_DATE_MESSAGE);
      else setFailure(failureFor(error));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <form ref={formRef} className="milestone-form" onSubmit={save} aria-labelledby={titleId} noValidate>
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
        id={`${titleId}-notes`}
        label="Note (optional)"
        error={notesError}
        hint="Only you can see these notes. We never share them."
        maxLength={NOTE_MAX_LENGTH}
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      {failure?.kind === "unauthorized" && (
        <InlineAlert kind="error" title="Please sign in again to continue">Your session has ended. What you typed is still here.</InlineAlert>
      )}
      {failure?.kind === "rejected" && <InlineAlert kind="error" title="We couldn't save this note">{failure.message}</InlineAlert>}
      {failure?.kind === "offline" && (
        <InlineAlert kind="offline" title="You're offline. Your note wasn't saved." action={<Button variant="secondary" onClick={() => void save()}>Retry</Button>}>
          What you typed is still here. Reconnect and try again.
        </InlineAlert>
      )}
      {failure?.kind === "error" && (
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
