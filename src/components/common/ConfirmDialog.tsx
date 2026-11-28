import { useId, type ReactNode } from "react";
import { Button } from "./Button";
import { ModalDialog } from "./ModalDialog";

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
 * Confirmation modal built on `ModalDialog`. The safe choice (cancel) receives focus first.
 */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();

  return (
    <ModalDialog open={open} labelledBy={titleId} onClose={onCancel}>
      <h2 id={titleId} className="ls-dialog-title">{title}</h2>
      <div className="ls-dialog-body">{children}</div>
      <div className="ls-dialog-actions">
        <Button variant="secondary" autoFocus onClick={onCancel}>{cancelLabel}</Button>
        <Button variant={destructive ? "danger" : "primary"} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </ModalDialog>
  );
}
