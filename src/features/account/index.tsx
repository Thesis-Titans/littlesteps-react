import { Link } from "react-router-dom";
import { Button } from "../../components/common";
import { useAuth } from "../auth";
import { AccountPage } from "./components/AccountPage";
import { ACCOUNT_PATHS } from "./content";

export { AboutScreen } from "./components/AboutScreen";
export { HelpScreen } from "./components/HelpScreen";
export { PrivacyScreen } from "./components/PrivacyScreen";
export { SettingsScreen } from "./components/SettingsScreen";

const LINKS = [
  { to: ACCOUNT_PATHS.settings, label: "Settings" },
  { to: ACCOUNT_PATHS.privacy, label: "Privacy notice" },
  { to: ACCOUNT_PATHS.about, label: "About LittleSteps" },
  { to: ACCOUNT_PATHS.help, label: "Help and support" },
];

/** Account menu: the landing page for everything behind the Account link. */
export function AccountScreen() {
  const { user, signOut } = useAuth();
  return (
    <AccountPage id="account-title" title="Account" subtitle={user?.email ?? undefined} back={false}>
      <nav aria-label="Account" className="account-menu">
        <ul>
          <li><Link to="/children">Your children</Link></li>
          {LINKS.map(({ to, label }) => <li key={to}><Link to={to}>{label}</Link></li>)}
        </ul>
      </nav>
      <Button variant="secondary" onClick={() => void signOut()}>Sign out</Button>
    </AccountPage>
  );
}
