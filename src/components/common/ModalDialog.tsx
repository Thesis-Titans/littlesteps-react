import { useEffect, useRef, type ReactNode } from "react";
import { useRestoreFocus } from "./useRestoreFocus";

export interface ModalDialogProps {
  /** Whether the modal dialog is open. */
  open: boolean;
  /** Element id of the heading that labels this dialog. */
  labelledBy: string;
  /** Called when the caregiver dismisses the dialog via Escape. */
  onClose: () => void;
  /** Optional extra class name appended to `ls-dialog`. */
  className?: string;
  /** Optional element to restore focus to instead of the last active element. */
  returnFocusTo?: HTMLElement | null;
  /** Optional fallback element id if the trigger element was unmounted. */
  fallbackFocusId?: string;
  /** Whether focus restoration should run when closing. Defaults to true. */
  restoreFocus?: boolean;
  children: ReactNode;
}

/**
 * Accessible native `<dialog>` wrapper that keeps focus trapped via `showModal()`,
 * handles Escape via `onCancel`, and restores focus when closed.
 */
export function ModalDialog({
  open,
  labelledBy,
  onClose,
  className = "",
  returnFocusTo,
  fallbackFocusId,
  restoreFocus = true,
  children,
}: ModalDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useRestoreFocus(restoreFocus && open, returnFocusTo, fallbackFocusId);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={className ? `ls-dialog ${className}` : "ls-dialog"}
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      {children}
    </dialog>
  );
}
