import { ScreenHeader } from "../../components/layout";
import { useChild } from "../children/useChild";
import { Advisory } from "./components/Advisory";
import { MilestonesList } from "./components/MilestonesList";

export function MilestonesScreen() {
  const { activeChild } = useChild();
  return (
    <section className="screen milestones" aria-labelledby="milestones-title">
      <ScreenHeader id="milestones-title" title="Milestones" subtitle="Small things to look for as your child plays." />
      <Advisory />
      {activeChild && <MilestonesList key={activeChild.id} child={activeChild} />}
    </section>
  );
}
