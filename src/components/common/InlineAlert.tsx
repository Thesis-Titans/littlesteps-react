import type { ReactNode } from "react";
import { Icon } from "./Icon";

type InlineAlertProps = {
  kind: "error" | "offline" | "info" | "caution";
  title: string;
  children?: ReactNode;
  /** A Retry or similar button. The alert stays until the problem is solved; it never times out. */
  action?: ReactNode;
};

const ICONS = { error: "info", offline: "wifi-off", info: "info", caution: "info" } as const;

export function InlineAlert({ kind, title, children, action }: InlineAlertProps) {
  return (
    <div className={`ls-alert ls-alert-${kind}`} role={kind === "error" ? "alert" : "status"}>
      <Icon name={ICONS[kind]} />
      <div className="ls-alert-body">
        <p className="ls-alert-title">{title}</p>
        {children && <div className="ls-alert-text">{children}</div>}
        {action && <div className="ls-alert-action">{action}</div>}
      </div>
    </div>
  );
}
