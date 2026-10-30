import { Outlet } from "react-router-dom";
import { gateView } from "../state";
import { useChild } from "../useChild";
import { ChildStatusNotice } from "./ChildStatus";
import { FirstRun } from "./FirstRun";

/** Wraps the five tab screens: they show only once there is a child. Account and Children sit outside it. */
export function ChildGate() {
  const { status, children, refresh } = useChild();
  const view = gateView(status, children.length);
  if (view === "content") return <Outlet />;
  if (view === "first-run") return <FirstRun />;
  return <ChildStatusNotice status={view} onRetry={refresh} />;
}
