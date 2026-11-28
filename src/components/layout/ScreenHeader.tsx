import type { ReactNode } from "react";
import { ChildSwitcher } from "../../features/children/components/ChildSwitcher";

type ScreenHeaderProps = {
  id: string;
  /** Matches the tab or menu label (UI/UX spec §5.2 page titles). */
  title: string;
  subtitle?: string;
  /** Optional secondary control aligned cleanly beside the header title block. */
  action?: ReactNode;
  /** Shows the "For [child]" label once a child is chosen. */
  childScoped?: boolean;
};

/** Screen title block with document `<title>`, optional subtitle/action, and mobile child switcher. */
export function ScreenHeader({
  id,
  title,
  subtitle,
  action,
  childScoped = true,
}: ScreenHeaderProps) {
  return (
    <>
      <title>{`${title} · LittleSteps`}</title>
      <div className="screen-header-row">
        <div className="screen-header-content">
          <h1 id={id} tabIndex={-1}>
            {title}
          </h1>
          {subtitle && <p className="screen-subtitle">{subtitle}</p>}
          {childScoped && <ChildSwitcher variant="chip" />}
        </div>
        {action && <div className="screen-header-action">{action}</div>}
      </div>
    </>
  );
}
