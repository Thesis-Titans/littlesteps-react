import { Logo } from "../common";
import { AccountLink } from "./AccountLink";
import { TabLinks } from "./TabLinks";

/** Desktop and tablet sidebar. */
export function SideNav() {
  return (
    <header className="side-nav">
      <Logo variant="horizontal" className="shell-logo" />
      <nav aria-label="Main">
        <TabLinks />
      </nav>
      <AccountLink />
    </header>
  );
}
