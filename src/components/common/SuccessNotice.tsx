import { useEffect, useRef } from "react";
import { Icon } from "./Icon";
import { createDismissTimer, MIN_TOAST_MS } from "./dismissTimer";

type SuccessNoticeProps = {
  /** Nothing shows while this is empty, but the status region stays mounted so the next message is announced. */
  message?: string;
  onClose: () => void;
  durationMs?: number;
};

/**
 * Confirms a finished action ("Maya added."). Keep it mounted and change `message`: the `role="status"` region exists
 * before its text, so screen readers announce it. Stays at least 10 s (restarts for each new message), pauses while
 * hovered or focused, can be dismissed (focus then moves to the page heading).
 */
export function SuccessNotice({ message, onClose, durationMs = MIN_TOAST_MS }: SuccessNoticeProps) {
  const timer = useRef<ReturnType<typeof createDismissTimer>>(undefined);

  useEffect(() => {
    if (!message) return;
    timer.current = createDismissTimer(durationMs, onClose);
    return () => timer.current?.clear();
  }, [message, durationMs, onClose]);

  return (
    <div role="status" aria-live="polite">
      {message && (
        <div className="ls-alert ls-alert-success"
          onMouseEnter={() => timer.current?.pause()} onMouseLeave={() => timer.current?.resume()}
          onFocus={() => timer.current?.pause()} onBlur={() => timer.current?.resume()}>
          <Icon name="check" />
          <p className="ls-alert-title">{message}</p>
          <button type="button" className="ls-toast-action ls-alert-dismiss" aria-label="Dismiss message"
            onClick={() => { onClose(); document.querySelector<HTMLElement>("h1")?.focus(); }}>
            <Icon name="close" />
          </button>
        </div>
      )}
    </div>
  );
}
