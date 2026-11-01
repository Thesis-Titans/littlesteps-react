import { ScreenHeader } from "../../components/layout";
import { IdeaHelper } from "../ai";
import { CatalogBrowser } from "../catalog";
import { useChild } from "../children/useChild";

/** Explore screen: Learning catalog browsing and AI idea helper with fallback */
export function ExploreScreen() {
  const { activeChild } = useChild();
  const ageBand = activeChild?.ageBand ?? "12-23m";
  const nickname = activeChild?.nickname;

  return (
    <section className="screen" aria-labelledby="explore-title">
      <ScreenHeader
        id="explore-title"
        title="Explore"
        subtitle="Play ideas and activities for everyday moments."
      />

      {/* AI idea helper */}
      <IdeaHelper
        ageBand={ageBand}
        childNickname={nickname}
      />

      {/* Age-aware catalog browser */}
      <CatalogBrowser
        initialAgeBand={ageBand}
        activeChildNickname={nickname}
      />
    </section>
  );
}
