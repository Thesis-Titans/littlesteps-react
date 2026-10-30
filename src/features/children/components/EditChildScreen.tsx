import { Link, useNavigate, useParams } from "react-router-dom";
import { InlineAlert } from "../../../components/common";
import { ScreenHeader } from "../../../components/layout";
import { useOnline } from "../hooks/useOnline";
import { useChild } from "../useChild";
import { ChildForm } from "./ChildForm";
import { ChildStatusNotice } from "./ChildStatus";

export function EditChildScreen() {
  const { childId } = useParams();
  const { children, status, refresh, editChild } = useChild();
  const online = useOnline();
  const navigate = useNavigate();
  const child = children.find((c) => c.id === childId);
  const back = () => navigate("/children");

  return (
    <section className="screen" aria-labelledby="edit-child-title">
      <ScreenHeader id="edit-child-title" title="Edit child" childScoped={false} />
      <ChildStatusNotice status={status} onRetry={refresh} hasChildren={children.length > 0} />
      {status === "ready" && !child && (
        <InlineAlert kind="error" title="We can't open this profile.">
          It may have been deleted. Your own notes are safe.
        </InlineAlert>
      )}
      {child && (
        <ChildForm
          key={child.id}
          child={child}
          online={online}
          onCancel={back}
          onSubmit={async (input) => {
            await editChild(child.id, input);
            back();
          }}
        />
      )}
      <Link className="text-button" to="/children">Back to your children</Link>
    </section>
  );
}
