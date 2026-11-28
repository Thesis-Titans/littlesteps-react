import type { ReactNode } from "react";

export interface TwoColumnLayoutProps {
  /** Primary content column. */
  main: ReactNode;
  /** Secondary contextual panel (sticky on desktop). */
  aside: ReactNode;
  /** Accessible landmark label for the complementary aside region. */
  asideLabel?: string;
  /** Placement of the aside column on desktop viewports (`>= 1024px`). */
  asidePosition?: "right" | "left";
  /** Whether the aside column is hidden below the desktop breakpoint. */
  hideAsideOnMobile?: boolean;
  className?: string;
}

/** Responsive two-column page grid that stacks on narrow screens and docks a sticky panel on desktop. */
export function TwoColumnLayout({
  main,
  aside,
  asideLabel,
  asidePosition = "right",
  hideAsideOnMobile = false,
  className = "",
}: TwoColumnLayoutProps) {
  const positionClass = asidePosition === "left" ? "ls-two-col-left" : "ls-two-col-right";
  const mobileClass = hideAsideOnMobile ? "ls-two-col-aside-desktop-only" : "";

  const asideNode = (
    <aside className={`ls-two-col-aside ${mobileClass}`.trim()} aria-label={asideLabel}>
      {aside}
    </aside>
  );

  const mainNode = <div className="ls-two-col-main">{main}</div>;

  return (
    <div className={`ls-two-col ${positionClass} ${className}`.trim()}>
      {asidePosition === "left" ? (
        <>
          {asideNode}
          {mainNode}
        </>
      ) : (
        <>
          {mainNode}
          {asideNode}
        </>
      )}
    </div>
  );
}
