import { useContext } from "react";
import { ChildContext } from "./context";
import type { ChildState } from "./types";

export function useChild(): ChildState {
  const context = useContext(ChildContext);
  if (!context) throw new Error("useChild must be used inside <ChildProvider>.");
  return context;
}
