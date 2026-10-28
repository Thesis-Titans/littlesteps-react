import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

type BadgeKind = "source" | "completed" | "ai" | "private" | "offline";

const KINDS: Record<BadgeKind, { icon: IconName; text: string }> = {
  source: { icon: "info", text: "Source: early learning guide · still being checked" },
  completed: { icon: "check", text: "Completed today" },
  ai: { icon: "sparkle", text: "Suggested by AI" },
  private: { icon: "lock", text: "Private" },
  offline: { icon: "wifi-off", text: "Offline" },
};

/** Status label. The default text follows the UI/UX spec wording; pass children only to change it. */
export function Badge({ kind, children }: { kind: BadgeKind; children?: ReactNode }) {
  return (
    <span className={`ls-badge ls-badge-${kind}`}>
      <Icon name={KINDS[kind].icon} size={16} />
      {children ?? KINDS[kind].text}
    </span>
  );
}
