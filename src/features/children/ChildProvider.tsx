import { useState, type ReactNode } from "react";
import { ChildContext } from "./context";
import type { Child } from "./types";

/** Stub for the app shell (react #18); the child profile workflow is react #6. */
export function ChildProvider({ children }: { children: ReactNode }) {
  const [activeChild, setActiveChild] = useState<Child | null>(null);
  return <ChildContext.Provider value={{ activeChild, setActiveChild }}>{children}</ChildContext.Provider>;
}
