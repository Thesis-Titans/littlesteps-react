import { Button, InlineAlert, Skeleton } from "../../../components/common";
import type { ChildStatus } from "../types";

/** Loading, error and offline states for anything that needs the child list. Renders nothing when ready. */
export function ChildStatusNotice({ status, onRetry }: { status: ChildStatus; onRetry: () => void }) {
  const retry = <Button variant="secondary" onClick={onRetry}>Retry</Button>;
  if (status === "loading") return <Skeleton kind="profile" label="Loading your children…" />;
  if (status === "offline") {
    return (
      <InlineAlert kind="offline" title="You're offline." action={retry}>
        We can't load your children right now. Reconnect and try again.
      </InlineAlert>
    );
  }
  if (status === "error") {
    return (
      <InlineAlert kind="error" title="We couldn't load your children." action={retry}>
        Your saved notes are safe. Please try again.
      </InlineAlert>
    );
  }
  return null;
}
