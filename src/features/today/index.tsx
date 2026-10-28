import { ScreenHeader } from "../../components/layout";

/** Today screen – Sprint 1 stub. Issue #8 implements the full planning flow. */
export function TodayScreen() {
  return (
    <section className="screen" aria-labelledby="today-title">
      <ScreenHeader id="today-title" title="Today" subtitle="Your plan for today will show here." />
    </section>
  );
}
