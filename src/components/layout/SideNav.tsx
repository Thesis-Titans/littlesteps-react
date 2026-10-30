import { Logo } from "../common";
import { ChildSwitcher } from "../../features/children/components/ChildSwitcher";
import { AccountLink } from "./AccountLink";
import { TabLinks } from "./TabLinks";

/** Desktop and tablet sidebar. */
export function SideNav() {
  return (
    <header className="side-nav">
      <Logo variant="horizontal" className="shell-logo" />
      <ChildSwitcher variant="side" />
      <nav aria-label="Main">
        <TabLinks />
      </nav>
      <AccountLink />
    </header>
  );
}
