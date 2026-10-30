import { NavLink } from "react-router-dom";
import { Icon, type IconName } from "../common";

const TABS: { to: string; label: string; display?: string; icon: IconName }[] = [
  { to: "/today", label: "Today", icon: "today" },
  { to: "/explore", label: "Explore", icon: "explore" },
  // display carries a soft hyphen so the label breaks as "Mile-stones" in the narrow bottom bar; Chrome does not hyphenate it by itself.
  { to: "/milestones", label: "Milestones", display: "Mile\u00ADstones", icon: "milestones" },
  { to: "/journal", label: "Journal", icon: "journal" },
  { to: "/this-week", label: "This week", icon: "this-week" },
];

/** The five tabs, shared by the desktop sidebar and the mobile bottom bar (UI/UX spec §5.2). */
export function TabLinks() {
  return (
    <ul className="tab-links">
      {TABS.map((tab) => (
        <li key={tab.to}>
          <NavLink to={tab.to} className="tab-link">
            <Icon name={tab.icon} size={24} />
            <span>{tab.display ?? tab.label}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  );
}
