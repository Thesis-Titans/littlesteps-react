import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button, Card, SuccessNotice } from "../../../components/common";
import { ScreenHeader } from "../../../components/layout";
import { addedMessage, readNotice } from "../notice";
import { useOnline } from "../hooks/useOnline";
import { ageBandLabel } from "../types";
import { useChild } from "../useChild";
import { ChildForm } from "./ChildForm";
import { ChildStatusNotice } from "./ChildStatus";
import { FirstRun } from "./FirstRun";

/** Account > Your children: the list, with edit and add. */
export function ChildrenScreen() {
  const { children, status, refresh, addChild } = useChild();
  const online = useOnline();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  // The message from an edit arrives in location state; take it once, then drop it so a reload does not repeat it.
  const [notice, setNotice] = useState(() => readNotice(location.state));
  useEffect(() => {
    if (readNotice(location.state)) navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: null });
  }, [location, navigate]);
  const closeNotice = useCallback(() => setNotice(undefined), []);
  const adding = params.has("add");
  const setAdding = (on: boolean) => setParams(on ? { add: "1" } : {}, { replace: true });

  return (
    <section className="screen" aria-labelledby="children-title">
      <ScreenHeader id="children-title" title="Your children" childScoped={false} />
      <ChildStatusNotice status={status} onRetry={refresh} hasChildren={children.length > 0} />
      <SuccessNotice message={notice} onClose={closeNotice} />
      {status === "ready" && children.length === 0 && (
        <FirstRun startOpen={adding} onAdded={(child) => { setNotice(addedMessage(child.nickname)); setAdding(false); }} />
      )}
      {children.length > 0 && (
        <>
          <ul className="child-list">
            {children.map((child) => (
              <Card as="li" key={child.id} className="child-list-item">
                <span>
                  <strong>{child.nickname}</strong>
                  <span className="child-list-age"> · {ageBandLabel(child.ageBand)}</span>
                </span>
                <Link className="child-edit-link" to={`/children/${encodeURIComponent(child.id)}/edit`}>
                  Edit<span className="ls-visually-hidden"> {child.nickname}</span>
                </Link>
              </Card>
            ))}
          </ul>
          {adding ? (
            <Card className="child-add-card">
              <h2>Add a child</h2>
              <ChildForm
                online={online}
                onCancel={() => setAdding(false)}
                onSubmit={async (input) => {
                  const child = await addChild(input);
                  setNotice(addedMessage(child.nickname));
                  setAdding(false);
                }}
              />
            </Card>
          ) : (
            <Button variant="secondary" onClick={() => { setNotice(undefined); setAdding(true); }}>Add a child</Button>
          )}
        </>
      )}
      <Link className="text-button" to="/account">Back to Account</Link>
    </section>
  );
}
