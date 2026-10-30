import { ageBandLabel, useChild } from "../../features/children";

type ScreenHeaderProps = {
  id: string;
  /** Matches the tab or menu label (UI/UX spec §5.2 page titles). */
  title: string;
  subtitle?: string;
  /** Shows the "For [child]" label once a child is chosen. */
  childScoped?: boolean;
};

export function ScreenHeader({ id, title, subtitle, childScoped = true }: ScreenHeaderProps) {
  const { activeChild } = useChild();
  return (
    <>
      <title>{`${title} · LittleSteps`}</title>
      <h1 id={id}>{title}</h1>
      {childScoped && activeChild && (
        <span className="ls-badge child-chip">For {activeChild.nickname} · {ageBandLabel(activeChild.ageBand)}</span>
      )}
      {subtitle && <p className="screen-subtitle">{subtitle}</p>}
    </>
  );
}
