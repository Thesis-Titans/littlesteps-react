import { Logo } from "../common";
import { AccountLink } from "./AccountLink";
import { ChildSwitcher } from "../../features/children/components/ChildSwitcher";

/** Mobile sticky header: logo, active child profile switcher, and account (UI/UX spec §5.2). */
export function TopBar() {
  return (
    <header className="top-bar">
      <Logo variant="horizontal" className="shell-logo" />
      <ChildSwitcher variant="top" />
      <AccountLink variant="avatar" />
    </header>
  );
}
