export type MenuAction = { focus: number } | { close: true } | null;

/** ArrowDown or ArrowUp on the closed trigger opens the menu. */
export const keyOpensMenu = (key: string) => key === "ArrowDown" || key === "ArrowUp";

/** The item to focus when the menu opens: the checked one, else the first. */
export const initialIndex = (checked: number) => (checked >= 0 ? checked : 0);

/** What a key does inside an open menu. `current` is -1 when focus is not on an item. */
export function menuAction(key: string, current: number, count: number): MenuAction {
  if (key === "Escape" || key === "Tab") return { close: true };
  if (count === 0) return null;
  if (key === "Home") return { focus: 0 };
  if (key === "End") return { focus: count - 1 };
  if (key === "ArrowDown") return { focus: (current + 1) % count };
  if (key === "ArrowUp") return { focus: current <= 0 ? count - 1 : current - 1 };
  return null;
}
