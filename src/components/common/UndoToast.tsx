import { useEffect, useRef } from "react";
import { createDismissTimer, MIN_TOAST_MS } from "./dismissTimer";

type UndoToastProps = {
  message: string;
  onUndo: () => void;
  /** Called when the toast times out. */
  onClose: () => void;
  durationMs?: number;
};

/** Undo for reversible actions. Stays at least 10 s and pauses while hovered or focused. */
export function UndoToast({ message, onUndo, onClose, durationMs = MIN_TOAST_MS }: UndoToastProps) {
  const timer = useRef<ReturnType<typeof createDismissTimer>>(undefined);

  useEffect(() => {
    timer.current = createDismissTimer(durationMs, onClose);
    return () => timer.current?.clear();
  }, [durationMs, onClose]);

  const pause = () => timer.current?.pause();
  const resume = () => timer.current?.resume();

  return (
    <div className="ls-toast" role="status" onMouseEnter={pause} onMouseLeave={resume} onFocus={pause} onBlur={resume}>
      <p>{message}</p>
      <button type="button" className="ls-toast-action" onClick={onUndo}>Undo</button>
    </div>
  );
}
