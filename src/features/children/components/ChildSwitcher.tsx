import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../../../components/common";
import { useChild } from "../useChild";
import { ageBandLabel } from "../types";

/** Menu button listing the caregiver's children (UI/UX spec §5.2). "side" sits in the sidebar, "top" in the mobile top bar. */
export function ChildSwitcher({ variant }: { variant: "side" | "top" }) {
  const { children, activeChild, status, setActiveChild } = useChild();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) root.current?.querySelector<HTMLElement>('[aria-checked="true"], [role^="menuitem"]')?.focus();
  }, [open]);

  if (status !== "ready") return null;
  if (!activeChild) return <Link className={`child-switcher-add child-switcher-${variant}`} to="/children?add=1">Add a child</Link>;

  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) button.current?.focus();
  };
  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") return close(true);
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const items = [...(root.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? [])];
    const next = items.indexOf(document.activeElement as HTMLElement) + (event.key === "ArrowDown" ? 1 : -1);
    items[(next + items.length) % items.length]?.focus();
  }

  return (
    <div
      ref={root}
      className={`child-switcher child-switcher-${variant}`}
      onKeyDown={onKeyDown}
      onBlur={(e) => !root.current?.contains(e.relatedTarget as Node | null) && setOpen(false)}
    >
      <button ref={button} type="button" className="child-switcher-button" aria-haspopup="menu" aria-expanded={open}
        aria-controls={menuId} onClick={() => setOpen(!open)}>
        <span className="ls-visually-hidden">Child: </span>
        <span className="child-switcher-label">
          {activeChild.nickname}<span className="child-switcher-age"> · {ageBandLabel(activeChild.ageBand)}</span>
        </span>
        <Icon name="chevron-down" />
      </button>
      {open && (
        <div id={menuId} role="menu" aria-label="Choose a child" className="child-menu">
          {children.map((child) => (
            <button key={child.id} type="button" role="menuitemradio" aria-checked={child.id === activeChild.id}
              onClick={() => { setActiveChild(child); close(true); }}>
              {child.nickname} · {ageBandLabel(child.ageBand)}
            </button>
          ))}
          <Link role="menuitem" to="/children?add=1" onClick={() => close(false)}>Add a child</Link>
          <Link role="menuitem" to="/children" onClick={() => close(false)}>Manage children</Link>
        </div>
      )}
    </div>
  );
}
