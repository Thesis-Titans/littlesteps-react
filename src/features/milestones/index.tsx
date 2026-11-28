import { useChild } from "../children/useChild";
import { MilestonesHeader } from "./components/Advisory";
import { MilestonesList } from "./components/MilestonesList";

/** Developmental milestones screen scoped to the active child profile. */
export function MilestonesScreen() {
  const { activeChild } = useChild();
  return (
    <section className="screen milestones" aria-labelledby="milestones-title">
      <MilestonesHeader subtitle="Small things to look for as your child plays." />
      {activeChild && <MilestonesList key={activeChild.id} child={activeChild} />}
    </section>
  );
}
