import { useState } from "react";
import { Button } from "../../../components/common";
import { NonDiagnosticNotice } from "../../children/components/NonDiagnosticNotice";

const KEY = "ls.milestones.advisorySeen";

/** Full advisory on the first visit (spec §5.2), then a persistent "Not a diagnostic tool" link that reopens it. */
export function Advisory() {
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(KEY) !== "1";
    } catch {
      return true;
    }
  });
  function dismiss() {
    setOpen(false);
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* private mode: the advisory simply shows again next visit */
    }
  }
  if (!open) return <Button variant="text" onClick={() => setOpen(true)}>Not a diagnostic tool</Button>;
  return (
    <div className="milestone-advisory">
      <NonDiagnosticNotice />
      <Button variant="secondary" onClick={dismiss}>Got it</Button>
    </div>
  );
}
