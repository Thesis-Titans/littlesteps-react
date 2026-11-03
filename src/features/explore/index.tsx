import { useState } from "react";
import { SuccessNotice } from "../../components/common";
import { ScreenHeader } from "../../components/layout";
import { IdeaHelper } from "../ai";
import { CatalogBrowser, type CatalogActivity } from "../catalog";
import { useChild } from "../children/useChild";
import { formatDate } from "../today/logic";
import { PlanActivityDialog } from "../today";

/** Explore screen: Learning catalog browsing and AI idea helper with fallback */
export function ExploreScreen() {
  const { activeChild } = useChild();
  const ageBand = activeChild?.ageBand ?? "12-23m";
  const nickname = activeChild?.nickname;
  const [planning, setPlanning] = useState<CatalogActivity | null>(null);
  const [notice, setNotice] = useState<string>();

  return (
    <section className="screen" aria-labelledby="explore-title">
      <ScreenHeader
        id="explore-title"
        title="Explore"
        subtitle="Play ideas and activities for everyday moments."
      />

      <SuccessNotice message={notice} onClose={() => setNotice(undefined)} />

      {/* AI idea helper */}
      <IdeaHelper
        ageBand={ageBand}
        childNickname={nickname}
      />

      {/* Age-aware catalog browser */}
      <CatalogBrowser
        initialAgeBand={ageBand}
        activeChildNickname={nickname}
        onPlan={activeChild ? setPlanning : undefined}
      />

      {activeChild && (
        <PlanActivityDialog
          activity={planning}
          childId={activeChild.id}
          childNickname={activeChild.nickname}
          onClose={() => setPlanning(null)}
          onPlanned={(plan, activity) => {
            setPlanning(null);
            setNotice(`${activity.title} added to ${activeChild.nickname}'s plan for ${formatDate(plan.scheduledDate)}.`);
          }}
        />
      )}
    </section>
  );
}
