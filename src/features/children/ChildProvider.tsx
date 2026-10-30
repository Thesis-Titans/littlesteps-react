import { useCallback, useEffect, useMemo, useReducer, useState, type ReactNode } from "react";
import { createChild, listChildren, updateChild } from "./api";
import { ChildContext } from "./context";
import { activeChildOf, failureStatus, initialState, onOnline, readActiveId, reducer, writeActiveId } from "./state";
import type { ChildState, CreateChildInput, UpdateChildInput } from "./types";

/** Loads the signed-in caregiver's children. Mount it keyed by user so nothing carries over between people. */
export function ChildProvider({ children, userId = "" }: { children: ReactNode; userId?: string }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => initialState(userId, readActiveId(userId)));
  const [reloads, setReloads] = useState(0);

  useEffect(() => {
    let live = true;
    listChildren().then(
      (list) => live && dispatch({ type: "loaded", userId, children: list }),
      (error: unknown) =>
        live &&
        dispatch({
          type: "failed",
          userId,
          status: failureStatus(error, navigator.onLine !== false),
          error: error instanceof Error ? error : new Error("Unknown error")
        })
    );
    return () => {
      live = false;
    };
  }, [reloads, userId]);

  const refresh = useCallback(() => {
    dispatch({ type: "loading" });
    setReloads((n) => n + 1);
  }, []);

  // Coming back online retries the list by itself.
  useEffect(() => {
    return onOnline(refresh);
  }, [refresh]);

  useEffect(() => {
    if (state.status === "ready") writeActiveId(userId, state.activeId);
  }, [userId, state.status, state.activeId]);

  const activeChild = activeChildOf(state);
  const value = useMemo<ChildState>(
    () => ({
      children: state.children,
      activeChild,
      status: state.status,
      error: state.error,
      setActiveChild: (child) => dispatch({ type: "select", id: child?.id ?? null }),
      refresh,
      addChild: async (input: CreateChildInput) => {
        const child = await createChild(input);
        dispatch({ type: "added", child });
        return child;
      },
      editChild: async (childId: string, input: UpdateChildInput) => {
        const child = await updateChild(childId, input);
        dispatch({ type: "edited", child });
        return child;
      }
    }),
    [state.children, activeChild, state.status, state.error, refresh]
  );

  return <ChildContext.Provider value={value}>{children}</ChildContext.Provider>;
}
