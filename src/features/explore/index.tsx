import { useState } from "react";
import { SuccessNotice } from "../../components/common";
import { ScreenHeader } from "../../components/layout";
import { IdeaHelper } from "../ai";
import { CatalogBrowser, type CatalogActivity } from "../catalog";
import { useChild } from "../children/useChild";
import type { Child } from "../children/types";
import { formatDate } from "../today/logic";
import { PlanActivityDialog } from "../today";
import { StorybooksSection } from "./components/StorybooksSection";
export { StorybooksSection };

function getChildAgeMonths(child?: Child | null): number | undefined {
  if (!child) return undefined;
  if (child.birthMonthYear) {
    const [yearStr, monthStr] = child.birthMonthYear.split("-");
    const y = parseInt(yearStr, 10);
    const m = parseInt(monthStr, 10);
    if (!isNaN(y) && !isNaN(m)) {
      const now = new Date();
      const diff = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m);
      return Math.max(0, Math.min(84, diff));
    }
  }
  const bandMidpoints: Record<string, number> = {
    "0-5m": 3,
    "6-11m": 8,
    "12-23m": 18,
    "24-35m": 30,
    "36-47m": 42,
    "48-59m": 54,
    "60-71m": 66,
  };
  return child.ageBand ? bandMidpoints[child.ageBand] : undefined;
}

/** Explore screen: Learning catalog browsing, AI idea helper, and storybooks */
export function ExploreScreen() {
  const { activeChild } = useChild();
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

      {/* AI idea helper */}
      <IdeaHelper
        ageBand={ageBand}
        childNickname={nickname}
        onPlanActivity={activeChild ? (activity) => setPlanning({ activity, opener: null }) : undefined}
      />

      {/* Age-aware catalog browser */}
      <CatalogBrowser
        initialAgeBand={ageBand}
        activeChildNickname={nickname}
        childAgeMonths={childAgeMonths}
        onPlan={activeChild ? (activity, opener) => setPlanning({ activity, opener }) : undefined}
      />

      {/* Storybooks from Open Library & Bookshelf (react #48, ADR-010, ADR-013, ADR-015) */}
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
