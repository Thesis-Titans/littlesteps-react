/** UI/UX spec §2.5: an undo toast stays for at least 10 seconds. */
export const MIN_TOAST_MS = 10_000;

/** A countdown that can pause (hover, focus) and resume with the time that was left. */
export function createDismissTimer(ms: number, onDone: () => void) {
  let remaining = Math.max(ms, MIN_TOAST_MS);
  let startedAt = 0;
  let handle: ReturnType<typeof setTimeout> | undefined;

  const resume = () => {
    if (handle !== undefined) return;
    startedAt = Date.now();
    handle = setTimeout(onDone, remaining);
  };
  const pause = () => {
    if (handle === undefined) return;
    clearTimeout(handle);
    handle = undefined;
    remaining -= Date.now() - startedAt;
  };
  const clear = () => {
    clearTimeout(handle);
    handle = undefined;
  };

  resume();
  return { pause, resume, clear };
}
