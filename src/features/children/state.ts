import { ApiError, UnauthorizedError } from "../../services/api";
import type { Child, ChildStatus } from "./types";

export type LoadState = {
  userId: string;
  children: Child[];
  activeId: string | null;
  status: ChildStatus;
  error: Error | null;
  /** Counts adds and edits, so a list request that started before one can be told apart. */
  mutations: number;
  /** `mutations` when the current list request started. */
  loadStartedAt: number;
  /** Children added or edited here, kept so an older list response cannot drop them. */
  touched: Record<string, Child>;
};

export type Action =
  | { type: "loading" }
  | { type: "loaded"; userId: string; children: Child[] }
  | { type: "failed"; userId: string; status: "error" | "offline" | "unauthorized"; error: Error }
  | { type: "select"; id: string | null }
  | { type: "added"; child: Child }
  | { type: "edited"; child: Child };

export const initialState = (userId: string, activeId: string | null): LoadState => ({
  userId, children: [], activeId, status: "loading", error: null, mutations: 0, loadStartedAt: 0, touched: {}
});

/** The server list with the children changed here since the request began put back. */
function mergeTouched(list: Child[], touched: Record<string, Child>): Child[] {
  const merged = list.map((c) => touched[c.id] ?? c);
  const extra = Object.values(touched).filter((c) => !list.some((l) => l.id === c.id));
  return [...merged, ...extra];
}

export function reducer(state: LoadState, action: Action): LoadState {
  switch (action.type) {
    case "loading":
      return { ...state, status: "loading", error: null, loadStartedAt: state.mutations };
    case "loaded": {
      if (action.userId !== state.userId) return state; // a different person's answer
      const stale = state.loadStartedAt !== state.mutations;
      const list = stale ? mergeTouched(action.children, state.touched) : action.children;
      return {
        ...state,
        children: list,
        // Keep the remembered child only if it still exists; otherwise fall back to the first one.
        activeId: list.some((c) => c.id === state.activeId) ? state.activeId : (list[0]?.id ?? null),
        status: "ready",
        error: null,
        touched: stale ? state.touched : {}
      };
    }
    case "failed":
      if (action.userId !== state.userId) return state;
      return { ...state, status: action.status, error: action.error };
    case "select":
      return { ...state, activeId: action.id };
    case "added":
      return {
        ...state,
        children: [...state.children, action.child],
        activeId: action.child.id,
        mutations: state.mutations + 1,
        touched: { ...state.touched, [action.child.id]: action.child }
      };
    case "edited":
      return {
        ...state,
        children: state.children.map((c) => (c.id === action.child.id ? action.child : c)),
        mutations: state.mutations + 1,
        touched: { ...state.touched, [action.child.id]: action.child }
      };
  }
}

export const activeChildOf = (state: Pick<LoadState, "children" | "activeId">): Child | null =>
  state.children.find((c) => c.id === state.activeId) ?? state.children[0] ?? null;

/** Offline only when the browser says so. Any other failure to reach the API is a plain error; 401 is its own state. */
export function failureStatus(error: unknown, online: boolean): "error" | "offline" | "unauthorized" {
  if (error instanceof UnauthorizedError || (error instanceof ApiError && error.status === 401)) return "unauthorized";
  return !online ? "offline" : "error";
}

/** Calls `fn` when the browser comes back online; returns the cleanup. `target` is injectable for tests. */
export function onOnline(
  fn: () => void,
  target: Pick<Window, "addEventListener" | "removeEventListener"> = window
): () => void {
  target.addEventListener("online", fn);
  return () => target.removeEventListener("online", fn);
}

export type GateView = "loading" | "error" | "offline" | "unauthorized" | "first-run" | "content";

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
