import { InlineAlert } from "./InlineAlert";

export interface SessionExpiredAlertProps {
  /** Supporting message displayed beneath the alert title. */
  message?: string;
}

/**
 * Standard alert shown when the caregiver's authentication session has expired.
 */
export function SessionExpiredAlert({
  message = "Your session has ended. Your saved notes are safe.",
}: SessionExpiredAlertProps) {
  return (
    <InlineAlert kind="error" title="Please sign in again to continue">
      <p>{message}</p>
    </InlineAlert>
  );
}
