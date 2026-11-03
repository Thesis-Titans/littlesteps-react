import { Badge, Button, Card } from "../../../components/common";
import { useEffect, useRef } from "react";
import { noteExcerpt, observedText } from "../logic";
import type { MilestoneObservation, MilestonePrompt } from "../types";
import { ObservationForm } from "./ObservationForm";

type Props = {
  childId: string;
  childName: string;
  prompt: MilestonePrompt;
  observation?: MilestoneObservation;
  editing: boolean;
  onEdit: () => void;
  onClose: () => void;
  onSaved: (observation: MilestoneObservation) => void;
};

export function PromptRow({ childId, childName, prompt, observation, editing, onEdit, onClose, onSaved }: Props) {
  const wasEditing = useRef(false);
  const focusInForm = useRef(false);
  // Closing the form (Save or Cancel) puts focus back on the button that opened it, but only if focus was
  // still in this form: when the caregiver moved on to another row, that row keeps focus.
  useEffect(() => {
    if (!editing && wasEditing.current && focusInForm.current && (!document.activeElement || document.activeElement === document.body)) {
      document.getElementById(`trigger-${prompt.id}`)?.focus();
    }
    if (!editing) focusInForm.current = false;
    wasEditing.current = editing;
  }, [editing, prompt.id]);
  const observed = observation?.status === "observed";
  return (
    <Card as="li" className="milestone-row">
      <h3 className="milestone-title">{prompt.title}</h3>
      <p className="milestone-look">Look for</p>
      <ul className="milestone-indicators">
        {prompt.indicators.map((text) => <li key={text}>{text}</li>)}
      </ul>
      <p className={observed ? "milestone-status milestone-status-seen" : "milestone-status"}>{observedText(observation)}</p>
      {observation?.notes && <p className="milestone-note">Your note: {noteExcerpt(observation.notes)}</p>}
      <p className="milestone-meta">
        <Badge kind="source">{prompt.provenanceSource}</Badge>
        {prompt.reviewStatus === "synthetic_fixture" && <Badge kind="source">Sample wording, not reviewed</Badge>}
      </p>
      {editing ? (
        <div
          className="milestone-form-wrap"
          onFocus={() => (focusInForm.current = true)}
          // A blur with no target (a button turning busy) keeps the flag; moving to an element elsewhere clears it.
          onBlur={(e) => {
            if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget as Node)) focusInForm.current = false;
          }}
        >
          <ObservationForm childId={childId} childName={childName} prompt={prompt} existing={observation} onSaved={onSaved} onClose={onClose} />
        </div>
      ) : (
        <Button id={`trigger-${prompt.id}`} variant="secondary" onClick={onEdit} aria-label={`${observation ? "Edit note" : "Note what you saw"}: ${prompt.title}`}>
          {observation ? "Edit note" : "Note what you saw"}
        </Button>
      )}
    </Card>
  );
}
