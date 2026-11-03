import { useEffect } from "react";

/** While `active`, remembers the focused control and puts focus back on it when the dialog closes or unmounts. Call before the effect that opens the dialog. */
export function useRestoreFocus(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const opener = document.activeElement as HTMLElement | null;
    return () => opener?.focus();
  }, [active]);
}
