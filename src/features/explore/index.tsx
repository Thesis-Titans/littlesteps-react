import { useState } from "react";
import { useLocation } from "react-router-dom";
import { SuccessNotice } from "../../components/common";
import { ScreenHeader } from "../../components/layout";
import { IdeaHelper } from "../ai";
import { CatalogBrowser, type CatalogActivity, type Setting } from "../catalog";
import { getChildAgeMonths } from "../children/types";
import { useChild } from "../children/useChild";
import { PlanActivityDialog } from "../today";
import { formatDate } from "../today/logic";
import { StorybooksSection } from "./components/StorybooksSection";

export { StorybooksSection };

type ExploreLocationState = {
  presetSetting?: Setting;
} | null;

/** Explore screen: AI idea helper, learning activity library, storybooks, and rhymes. */
export function ExploreScreen() {
  const { activeChild } = useChild();
  const location = useLocation();
  const presetSetting = (location.state as ExploreLocationState)?.presetSetting;
  const ageBand = activeChild?.ageBand ?? "12-23m";
  const nickname = activeChild?.nickname;
  const childAgeMonths = getChildAgeMonths(activeChild);
  const [planning, setPlanning] = useState<{ activity: CatalogActivity; opener: HTMLElement | null } | null>(null);
  const [notice, setNotice] = useState<string>();

  return (
    <section className="screen" aria-labelledby="explore-title">
      <ScreenHeader
        id="explore-title"
        title="Explore"
        subtitle="Play ideas and activities for everyday moments."
      />

      <SuccessNotice message={notice} onClose={() => setNotice(undefined)} />

      <IdeaHelper
        ageBand={ageBand}
        childNickname={nickname}
        initialSetting={presetSetting}
        onPlanActivity={activeChild ? (activity) => setPlanning({ activity, opener: null }) : undefined}
      />

      <CatalogBrowser
        initialAgeBand={ageBand}
        activeChildNickname={nickname}
        childAgeMonths={childAgeMonths}
        onPlan={activeChild ? (activity, opener) => setPlanning({ activity, opener }) : undefined}
      />

      <StorybooksSection
        childId={activeChild?.id}
        onPlan={activeChild ? (activity) => setPlanning({ activity, opener: null }) : undefined}
        ageBand={ageBand}
        childNickname={nickname}
      />

      {activeChild && (
        <PlanActivityDialog
          activity={planning?.activity ?? null}
          returnFocusTo={planning?.opener}
          fallbackFocusId="explore-title"
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
