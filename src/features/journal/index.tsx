import { ScreenHeader } from "../../components/layout";

/** Journal screen – Sprint 1 stub. Issue #9 implements the journal. */
export function JournalScreen() {
  return (
    <section className="screen" aria-labelledby="journal-title">
      <ScreenHeader id="journal-title" title="Journal" subtitle="Your private notes will show here." />
    </section>
  );
}
