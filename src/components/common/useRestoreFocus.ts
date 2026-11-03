import { useEffect } from "react";

/**
 * While `active`, remembers the focused control (or `opener`, when the dialog was opened from another dialog that
 * has since closed) and puts focus back on it when the dialog closes. If that control is gone, focus goes to the
 * element with id `fallbackId`. Call before the effect that opens the dialog.
 */
export function useRestoreFocus(active: boolean, opener?: HTMLElement | null, fallbackId?: string) {
  useEffect(() => {
    if (!active) return;
    const target = opener ?? (document.activeElement as HTMLElement | null);
    return () => {
      const el = target?.isConnected ? target : fallbackId ? document.getElementById(fallbackId) : null;
      el?.focus();
    };
  }, [active, opener, fallbackId]);
}
