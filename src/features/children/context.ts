import { createContext } from "react";
import type { ChildState } from "./types";

export const ChildContext = createContext<ChildState | null>(null);
