import { useCallback, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SuccessNotice } from "../../../components/common";
import { addedMessage, noticeFor, type PageNotice } from "../notice";
import { gateView } from "../state";
import { useChild } from "../useChild";
import { ChildStatusNotice } from "./ChildStatus";
import { FirstRun } from "./FirstRun";

/** Wraps the five tab screens: they show only once there is a child. Account and Children sit outside it. */
export function ChildGate() {
  const { status, children, refresh } = useChild();
  const view = gateView(status, children.length);
  const { pathname } = useLocation();
  // The first child is added on a tab screen; the message shows there and goes when the caregiver moves on.
  const [notice, setNotice] = useState<PageNotice>();
  const closeNotice = useCallback(() => setNotice(undefined), []);
  const message = noticeFor(notice, pathname);
  if (view === "content") {
    return (
      <>
        {message && <SuccessNotice message={message} onClose={closeNotice} />}
        <Outlet />
      </>
    );
  }
  if (view === "first-run") {
    return <FirstRun onAdded={(child) => setNotice({ message: addedMessage(child.nickname), path: pathname })} />;
  }
  return <ChildStatusNotice status={view} onRetry={refresh} />;
}
