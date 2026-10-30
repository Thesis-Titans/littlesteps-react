import { useState } from "react";
import { Button, EmptyState } from "../../../components/common";
import { useOnline } from "../hooks/useOnline";
import { useChild } from "../useChild";
import { ChildForm } from "./ChildForm";
import { NonDiagnosticNotice } from "./NonDiagnosticNotice";

/** Empty state for a caregiver with no children; the action opens the add form in place. */
export function FirstRun({ startOpen = false, onAdded }: { startOpen?: boolean; onAdded?: () => void }) {
  const { addChild } = useChild();
  const online = useOnline();
  const [open, setOpen] = useState(startOpen);
  if (!open) {
    return (
      <EmptyState
        title="Add your first child"
        action={<Button onClick={() => setOpen(true)}>Add your first child</Button>}
      >
        <p>No children added yet. Add your child to get ideas for their age.</p>
      </EmptyState>
    );
  }
  return (
    <div className="child-first-run">
      <h2>Add your first child</h2>
      <NonDiagnosticNotice />
      <ChildForm online={online} onSubmit={async (input) => { await addChild(input); onAdded?.(); }} />
    </div>
  );
}
