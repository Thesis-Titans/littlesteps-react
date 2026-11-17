import { ChildSwitcher } from "../../features/children/components/ChildSwitcher";

type ScreenHeaderProps = {
  id: string;
  /** Matches the tab or menu label (UI/UX spec §5.2 page titles). */
  title: string;
  subtitle?: string;
  /** Shows the "For [child]" label once a child is chosen. */
  childScoped?: boolean;
};

export function ScreenHeader({ id, title, subtitle, childScoped = true }: ScreenHeaderProps) {
  return (
    <>
      <title>{`${title} · LittleSteps`}</title>
      <div className="screen-header-content">
        <h1 id={id} tabIndex={-1}>{title}</h1>
        {subtitle && <p className="screen-subtitle">{subtitle}</p>}
        {childScoped && <ChildSwitcher variant="chip" />}
      </div>
    </>
  );
}
