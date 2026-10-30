import { useOutletContext } from "react-router-dom";
import type { ShellContext } from "../../../components/layout/ProtectedRoute";
import { Button, InlineAlert, Skeleton } from "../../../components/common";
import { showChildAlert } from "../state";
import type { ChildStatus } from "../types";

/**
 * Loading, error, offline and signed-out states for anything that needs the child list. Renders nothing when ready.
 * With `hasChildren` it sits above the list and never replaces it, so loading shows nothing.
 */
export function ChildStatusNotice({ status, onRetry, hasChildren = false }: { status: ChildStatus; onRetry: () => void; hasChildren?: boolean }) {
  // Outside the shell (or in tests) there is no context, so no shell alert.
  const sessionProblem = useOutletContext<ShellContext | undefined>()?.sessionProblem;
  const retry = <Button variant="secondary" onClick={onRetry}>Retry</Button>;
  if (status === "loading") return hasChildren ? null : <Skeleton kind="profile" label="Loading your children…" />;
  if ((status === "offline" || status === "error") && !showChildAlert(sessionProblem, status)) return null;
  if (status === "offline") {
    return (
      <InlineAlert kind="offline" title="You're offline." action={retry}>
        We can't load your children right now. Reconnect and try again.
      </InlineAlert>
    );
  }
  if (status === "error") {
    return (
      <InlineAlert kind="error" title="We couldn't reach LittleSteps." action={retry}>
        Try again. Your saved notes are safe.
      </InlineAlert>
    );
  }
  if (status === "unauthorized") {
    return (
      <InlineAlert kind="error" title="Please sign in again.">
        Your session has ended. Your saved notes are safe.
      </InlineAlert>
    );
  }
  return null;
}
