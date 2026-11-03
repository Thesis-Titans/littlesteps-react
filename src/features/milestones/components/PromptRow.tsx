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
  // Closing the form (Save or Cancel) puts focus back on the button that opened it.
  useEffect(() => {
    if (!editing && wasEditing.current) document.getElementById(`trigger-${prompt.id}`)?.focus();
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
        <ObservationForm childId={childId} childName={childName} prompt={prompt} existing={observation} onSaved={onSaved} onClose={onClose} />
      ) : (
        <Button id={`trigger-${prompt.id}`} variant="secondary" onClick={onEdit} aria-label={`${observation ? "Edit note" : "Note what you saw"}: ${prompt.title}`}>
          {observation ? "Edit note" : "Note what you saw"}
        </Button>
      )}
    </Card>
  );
}
