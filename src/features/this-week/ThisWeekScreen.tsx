import { ScreenHeader } from "../../components/layout";

/** ThisWeek screen – Sprint 1 stub. Issue #10 implements the weekly reflection. */
export function ThisWeekScreen() {
  return (
    <section className="screen" aria-labelledby="this-week-title">
      <ScreenHeader id="this-week-title" title="This week" subtitle="A look back at your week will show here." />
    </section>
  );
}
