import { NavLink } from "react-router-dom";
import { Icon } from "../common";
import { useAuth } from "../../features/auth/useAuth";

export function AccountLink({ variant = "default" }: { variant?: "default" | "avatar" }) {
  const { user } = useAuth();
  const caregiverName = user?.displayName?.trim() || user?.email?.split("@")[0]?.trim() || "Caregiver";
  const initial = Array.from(caregiverName)[0]?.toLocaleUpperCase() ?? "C";
  const isAvatar = variant === "avatar";

  return (
    <NavLink to="/account" className="account-link" aria-label={isAvatar ? "Account" : undefined}>
      {isAvatar ? <span className="account-avatar" aria-hidden="true">{initial}</span> : <Icon name="user" size={20} />}
      <span className={isAvatar ? "account-link-label account-link-label-hidden" : "account-link-label"} aria-hidden={isAvatar || undefined}>Account</span>
    </NavLink>
  );
}
