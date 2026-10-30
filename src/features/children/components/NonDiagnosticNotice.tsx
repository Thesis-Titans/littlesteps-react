import { InlineAlert } from "../../../components/common";

/** Advisory from UI/UX spec §2.6 and §6.3. Dismissing it and the "Not a diagnostic tool" link belong to Today and Milestones. */
export function NonDiagnosticNotice() {
  return (
    <InlineAlert kind="caution" title="Not a diagnostic tool">
      LittleSteps shares play ideas and things to look for. It's not a test. Children develop at different rates.
      Talk to a health professional, like your pediatrician or barangay health worker, if you have concerns.
    </InlineAlert>
  );
}
