import { TabLinks } from "./TabLinks";

/** Mobile fixed bottom bar with the same five tabs. */
export function BottomTabBar() {
  return (
    <nav className="bottom-tab-bar" aria-label="Main">
      <TabLinks />
    </nav>
  );
}
