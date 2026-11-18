import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * After an in-app navigation, moves focus to the new screen's h1 (ScreenHeader gives it tabIndex -1),
 * so screen readers announce the page and keyboard users continue from the top of it.
 * Skipped on first load, so the browser's normal start position is kept.
 */
export function useFocusHeadingOnNavigate() {
  const { pathname } = useLocation();
  const previous = useRef(pathname);
  useEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;
    document.querySelector<HTMLElement>("main h1")?.focus();
  }, [pathname]);
}
