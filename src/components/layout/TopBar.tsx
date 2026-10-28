import { Logo } from "../common";
import { AccountLink } from "./AccountLink";

/** Mobile sticky header: one 60px row with the logo and account (UI/UX spec §5.2). */
export function TopBar() {
  return (
    <header className="top-bar">
      <Logo variant="horizontal" className="shell-logo" />
      <AccountLink />
    </header>
  );
}
