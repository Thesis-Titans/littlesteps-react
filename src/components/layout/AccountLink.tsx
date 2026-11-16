import { NavLink } from "react-router-dom";
import { Icon } from "../common";

export function AccountLink() {
  return (
    <NavLink to="/account" className="account-link">
      <Icon name="user" size={20} />
      <span>Account</span>
    </NavLink>
  );
}
