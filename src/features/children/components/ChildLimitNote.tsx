import { MSG } from "../form";

type NoteProps = { className?: string; role?: "menuitem"; tabIndex?: number };

/** Stands in for the "Add a child" actions once the limit is reached. Inside a menu it is a disabled menu item, so the menu only holds valid children. */
export const ChildLimitNote = ({ className = "", role, tabIndex }: NoteProps) => (
  <p className={`child-limit-note ${className}`.trim()} role={role} tabIndex={tabIndex} aria-disabled={role ? true : undefined}>
    {MSG.limitNote}
  </p>
);
