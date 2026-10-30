import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../../../components/common";
import { useChild } from "../useChild";
import { ageBandLabel } from "../types";
import { initialIndex, keyOpensMenu, menuAction } from "./menuKeys";

/** Menu button listing the caregiver's children (UI/UX spec §5.2). "side" sits in the sidebar, "top" in the mobile top bar. */
export function ChildSwitcher({ variant }: { variant: "side" | "top" }) {
  const { children, activeChild, status, setActiveChild } = useChild();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0); // roving tabindex: the one item that is tabbable and focused
  const menuId = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const items = () => [...(root.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? [])];

  useEffect(() => {
    if (open) items()[index]?.focus();
  }, [open, index]);

  // Safari and iOS give no relatedTarget on blur, so close on a press outside instead.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Keep showing the children we already have, even while a refresh runs or fails.
  if (children.length === 0 || !activeChild) {
    if (status !== "ready") return null;
    return <Link className={`child-switcher-add child-switcher-${variant}`} to="/children?add=1">Add a child</Link>;
  }

  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) button.current?.focus();
  };
  const openMenu = () => {
    setIndex(initialIndex(children.findIndex((c) => c.id === activeChild.id)));
    setOpen(true);
  };
  function onKeyDown(event: KeyboardEvent) {
    if (!open) {
      if (keyOpensMenu(event.key)) {
        event.preventDefault();
        openMenu();
      }
      return;
    }
    const action = menuAction(event.key, items().indexOf(document.activeElement as HTMLElement), items().length);
    if (!action) return;
    if ("close" in action) return close(true); // Tab moves on from the trigger, so focus is not lost
    event.preventDefault();
    setIndex(action.focus);
  }

  return (
    <div
      ref={root}
      className={`child-switcher child-switcher-${variant}`}
      onKeyDown={onKeyDown}
    >
      <button ref={button} type="button" className="child-switcher-button" aria-haspopup="menu" aria-expanded={open}
        aria-controls={menuId} onClick={() => (open ? close(false) : openMenu())}>
        <span className="ls-visually-hidden">Child: </span>
        <span className="child-switcher-label">
          {activeChild.nickname}<span className="child-switcher-age"> · {ageBandLabel(activeChild.ageBand)}</span>
        </span>
        <Icon name="chevron-down" />
      </button>
      {open && (
        <div id={menuId} role="menu" aria-label="Choose a child" className="child-menu">
          {children.map((child, i) => (
            <button key={child.id} type="button" role="menuitemradio" aria-checked={child.id === activeChild.id}
              tabIndex={i === index ? 0 : -1}
              onClick={() => { setActiveChild(child); close(true); }}>
              {child.nickname} · {ageBandLabel(child.ageBand)}
            </button>
          ))}
          <Link role="menuitem" tabIndex={children.length === index ? 0 : -1} to="/children?add=1" onClick={() => close(false)}>Add a child</Link>
          <Link role="menuitem" tabIndex={children.length + 1 === index ? 0 : -1} to="/children" onClick={() => close(false)}>Manage children</Link>
        </div>
      )}
    </div>
  );
}
