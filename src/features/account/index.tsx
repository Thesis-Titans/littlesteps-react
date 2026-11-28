import { Link } from "react-router-dom";
import { Button, Icon, type IconName } from "../../components/common";
import { useAuth } from "../auth";
import { AccountPage } from "./components/AccountPage";
import { ACCOUNT_PATHS } from "./content";

export { AboutScreen } from "./components/AboutScreen";
export { HelpScreen } from "./components/HelpScreen";
export { PrivacyScreen } from "./components/PrivacyScreen";
export { SettingsScreen } from "./components/SettingsScreen";

const MENU_ITEMS: { to: string; label: string; icon: IconName }[] = [
  { to: "/children", label: "Your children", icon: "user" },
  { to: ACCOUNT_PATHS.settings, label: "Settings", icon: "today" },
  { to: ACCOUNT_PATHS.privacy, label: "Privacy notice", icon: "lock" },
  { to: ACCOUNT_PATHS.about, label: "About LittleSteps", icon: "info" },
  { to: ACCOUNT_PATHS.help, label: "Help and support", icon: "book" },
];

/** Account menu: landing page for child profiles, settings, privacy, about, and help. */
export function AccountScreen() {
  const { user, signOut } = useAuth();
  return (
    <AccountPage
      id="account-title"
      title="Account"
      subtitle={user?.email ?? undefined}
      back={false}
    >
      <nav aria-label="Account" className="account-menu">
        <ul>
          {MENU_ITEMS.map(({ to, label, icon }) => (
            <li key={to}>
              <Link to={to}>
                <span className="account-menu-label">
                  <Icon name={icon} size={18} />
                  <span>{label}</span>
                </span>
                <Icon name="chevron-right" size={18} className="account-menu-chevron" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <Button
        variant="secondary"
        className="account-signout-btn"
        onClick={() => void signOut()}
      >
        Sign out
      </Button>
    </AccountPage>
  );
}
