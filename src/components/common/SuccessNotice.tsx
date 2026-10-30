import { useEffect, useRef } from "react";
import { Icon } from "./Icon";
import { createDismissTimer, MIN_TOAST_MS } from "./dismissTimer";

type SuccessNoticeProps = {
  message: string;
  onClose: () => void;
  durationMs?: number;
};

/** Confirms a finished action ("Maya added."). Stays at least 10 s, pauses while hovered or focused, can be dismissed. */
export function SuccessNotice({ message, onClose, durationMs = MIN_TOAST_MS }: SuccessNoticeProps) {
  const timer = useRef<ReturnType<typeof createDismissTimer>>(undefined);

  useEffect(() => {
    timer.current = createDismissTimer(durationMs, onClose);
    return () => timer.current?.clear();
  }, [durationMs, onClose]);

  return (
    <div className="ls-alert ls-alert-success" role="status"
      onMouseEnter={() => timer.current?.pause()} onMouseLeave={() => timer.current?.resume()}
      onFocus={() => timer.current?.pause()} onBlur={() => timer.current?.resume()}>
      <Icon name="check" />
      <p className="ls-alert-title">{message}</p>
      <button type="button" className="ls-toast-action ls-alert-dismiss" onClick={onClose} aria-label="Dismiss message">
        <Icon name="close" />
      </button>
    </div>
  );
}
