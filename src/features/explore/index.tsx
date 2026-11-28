import { useState } from "react";
import { useLocation } from "react-router-dom";
import { SegmentedTabs, SuccessNotice, type SegmentedTabItem } from "../../components/common";
import { ScreenHeader } from "../../components/layout";
import { IdeaHelper, IdeaHelperBanner } from "../ai";
import { CatalogBrowser, type CatalogActivity, type Setting } from "../catalog";
import { getChildAgeMonths } from "../children/types";
import { useChild } from "../children/useChild";
import { PlanActivityDialog } from "../today";
import { formatDate } from "../today/logic";
import { StorybooksSection, type StorybooksTabId } from "./components/StorybooksSection";

export { StorybooksSection };

type ExploreLocationState = {
  presetSetting?: Setting;
} | null;

type ExploreTabId = "activities" | StorybooksTabId;

/** Explore screen: segmented catalog navigation, Idea Helper, storybooks, and Philippine rhymes. */
export function ExploreScreen() {
  const { activeChild } = useChild();
  const location = useLocation();
  const presetSetting = (location.state as ExploreLocationState)?.presetSetting;
  const ageBand = activeChild?.ageBand ?? "12-23m";
  const nickname = activeChild?.nickname;
  const childAgeMonths = getChildAgeMonths(activeChild);

  const [activeTab, setActiveTab] = useState<ExploreTabId>("activities");
  const [ideaHelperOpen, setIdeaHelperOpen] = useState(Boolean(presetSetting));
  const [savedBookCount, setSavedBookCount] = useState(0);
  const [planning, setPlanning] = useState<{ activity: CatalogActivity; opener: HTMLElement | null } | null>(null);
  const [notice, setNotice] = useState<string>();

  const tabs: SegmentedTabItem<ExploreTabId>[] = [
    { id: "activities", label: "Activities" },
    { id: "books", label: "Storybooks" },
    { id: "shelf", label: "Our Bookshelf", count: savedBookCount },
    { id: "rhymes", label: "Read & Sing Together" },
  ];

  const isActivitiesTab = activeTab === "activities";
  const controlledShelfTab: StorybooksTabId = isActivitiesTab ? "books" : activeTab;

  return (
    <section className="screen" aria-labelledby="explore-title">
      <ScreenHeader
        id="explore-title"
        title="Explore"
        subtitle="Simple ideas with things you already have."
      />

      <SuccessNotice message={notice} onClose={() => setNotice(undefined)} />

      <SegmentedTabs
        ariaLabel="Explore sections"
        tabs={tabs}
        activeId={activeTab}
        onChange={setActiveTab}
      />

      {isActivitiesTab && (
        <>
          {ideaHelperOpen ? (
            <IdeaHelper
              ageBand={ageBand}
              childNickname={nickname}
              initialSetting={presetSetting}
              onClose={() => setIdeaHelperOpen(false)}
              onPlanActivity={activeChild ? (activity) => setPlanning({ activity, opener: null }) : undefined}
            />
          ) : (
            <IdeaHelperBanner
              childNickname={nickname}
              onOpen={() => setIdeaHelperOpen(true)}
            />
          )}

          <CatalogBrowser
            initialAgeBand={ageBand}
            activeChildNickname={nickname}
            childAgeMonths={childAgeMonths}
            onPlan={activeChild ? (activity, opener) => setPlanning({ activity, opener }) : undefined}
          />
        </>
      )}

      <div hidden={isActivitiesTab}>
        <StorybooksSection
          childId={activeChild?.id}
          controlledTab={controlledShelfTab}
          onTabChange={setActiveTab}
          onSavedCountChange={setSavedBookCount}
          onPlan={activeChild ? (activity) => setPlanning({ activity, opener: null }) : undefined}
          ageBand={ageBand}
          childNickname={nickname}
        />
      </div>

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
