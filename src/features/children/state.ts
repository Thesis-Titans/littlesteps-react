import { ApiError, UnauthorizedError } from "../../services/api";
import type { Child, ChildStatus } from "./types";

export type LoadState = { children: Child[]; activeId: string | null; status: ChildStatus; error: Error | null };

export type Action =
  | { type: "loading" }
  | { type: "loaded"; children: Child[] }
  | { type: "failed"; status: "error" | "offline"; error: Error }
  | { type: "select"; id: string | null }
  | { type: "added"; child: Child }
  | { type: "edited"; child: Child };

export function reducer(state: LoadState, action: Action): LoadState {
  switch (action.type) {
    case "loading":
      return { ...state, status: "loading", error: null };
    case "loaded":
      return {
        ...state,
        children: action.children,
        // Keep the remembered child only if it still exists; otherwise fall back to the first one.
        activeId: action.children.some((c) => c.id === state.activeId) ? state.activeId : (action.children[0]?.id ?? null),
        status: "ready",
        error: null
      };
    case "failed":
      return { ...state, status: action.status, error: action.error };
    case "select":
      return { ...state, activeId: action.id };
    case "added":
      return { ...state, children: [...state.children, action.child], activeId: action.child.id };
    case "edited":
      return { ...state, children: state.children.map((c) => (c.id === action.child.id ? action.child : c)) };
  }
}

export const activeChildOf = (state: Pick<LoadState, "children" | "activeId">): Child | null =>
  state.children.find((c) => c.id === state.activeId) ?? state.children[0] ?? null;

/** "offline" only when the browser says so or fetch itself failed; API answers (401, 404, 500) are "error". */
export function failureStatus(error: unknown, online: boolean): "error" | "offline" {
  if (error instanceof ApiError || error instanceof UnauthorizedError) return "error";
  return !online || error instanceof TypeError ? "offline" : "error";
}

export type GateView = "loading" | "error" | "offline" | "first-run" | "content";

/** What the five tab screens show: their content, or a state that comes first. */
export function gateView(status: ChildStatus, childCount: number): GateView {
  if (childCount > 0) return "content"; // a background refresh or failed retry never hides screens already showing
  return status === "ready" ? "first-run" : status;
}

// Only the child id is remembered, per user, for this browser session (not localStorage).
const storageKey = (userId: string) => `littlesteps.activeChild.${userId}`;

export function readActiveId(userId: string): string | null {
  try {
    return sessionStorage.getItem(storageKey(userId));
  } catch {
    return null;
  }
}

export function writeActiveId(userId: string, id: string | null): void {
  try {
    if (id) sessionStorage.setItem(storageKey(userId), id);
    else sessionStorage.removeItem(storageKey(userId));
  } catch {
    // Storage can be blocked; the choice then lasts until the page reloads.
  }
}
