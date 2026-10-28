import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "./Button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  /** Names the action, e.g. "Delete note" — never "OK" or "Yes". */
  confirmLabel: string;
  cancelLabel?: string;
  /** Use for permanent deletes: shows the action in the error style. */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Built on the native <dialog>: showModal() keeps focus inside and makes the page behind inert,
 * and Escape fires `cancel`. The safe choice (cancel) gets focus first.
 */
export function ConfirmDialog({ open, title, children, confirmLabel, cancelLabel = "Cancel", destructive = false, onConfirm, onCancel }: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="ls-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <h2 id={titleId} className="ls-dialog-title">{title}</h2>
      <div className="ls-dialog-body">{children}</div>
      <div className="ls-dialog-actions">
        <Button variant="secondary" autoFocus onClick={onCancel}>{cancelLabel}</Button>
        <Button variant={destructive ? "danger" : "primary"} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </dialog>
  );
}
