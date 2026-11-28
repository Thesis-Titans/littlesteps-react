import { useState } from "react";
import { Button } from "../../../components/common";
import { ScreenHeader } from "../../../components/layout";
import { NonDiagnosticNotice } from "../../children/components/NonDiagnosticNotice";

const KEY = "ls.milestones.advisorySeen";

function readAdvisorySeen(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function writeAdvisorySeen() {
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    /* private mode: the advisory shows again on next visit */
  }
}

/** Full advisory on first visit, then a compact "Not a diagnostic tool" toggle to reopen it. */
export function Advisory({ onDismiss }: { onDismiss?: () => void } = {}) {
  const [open, setOpen] = useState(() => !readAdvisorySeen());

  function dismiss() {
    if (onDismiss) {
      onDismiss();
      return;
    }
    setOpen(false);
    writeAdvisorySeen();
  }

  if (!onDismiss && !open) {
    return (
      <Button variant="text" className="milestone-advisory-toggle" onClick={() => setOpen(true)}>
        Not a diagnostic tool
      </Button>
    );
  }

  return (
    <div className="milestone-advisory">
      <NonDiagnosticNotice />
      <Button variant="secondary" onClick={dismiss}>
        Got it
      </Button>
    </div>
  );
}

/** Milestones header that docks the collapsed "Not a diagnostic tool" toggle alongside the title. */
export function MilestonesHeader({ subtitle }: { subtitle: string }) {
  const [open, setOpen] = useState(() => !readAdvisorySeen());

  function handleDismiss() {
    setOpen(false);
    writeAdvisorySeen();
  }

  return (
    <>
      <ScreenHeader
        id="milestones-title"
        title="Milestones"
        subtitle={subtitle}
        action={
          !open ? (
            <Button
              variant="text"
              className="milestone-advisory-toggle"
              onClick={() => setOpen(true)}
            >
              Not a diagnostic tool
            </Button>
          ) : undefined
        }
      />
      {open && <Advisory onDismiss={handleDismiss} />}
    </>
  );
}
