import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Card, ConfirmDialog, InlineAlert } from "../../../components/common";
import { ScreenHeader } from "../../../components/layout";
import { failureKind } from "../../../services/offline";
import { useOnline } from "../hooks/useOnline";
import { noticeState, savedMessage } from "../notice";
import { useChild } from "../useChild";
import { ChildForm } from "./ChildForm";
import { ChildStatusNotice } from "./ChildStatus";

/** Screen for editing or permanently deleting an existing child profile. */
export function EditChildScreen() {
  const { childId } = useParams();
  const { children, status, refresh, editChild, removeChild } = useChild();
  const online = useOnline();
  const navigate = useNavigate();
  const child = children.find((c) => c.id === childId);
  const back = () => navigate("/children");

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete() {
    if (!child || !removeChild) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await removeChild(child.id);
      setConfirmDeleteOpen(false);
      navigate("/children", {
        state: noticeState(`${child.nickname}'s profile was deleted.`),
      });
    } catch (error) {
      setConfirmDeleteOpen(false);
      const offline = failureKind(error, navigator.onLine) === "offline";
      setDeleteError(
        offline
          ? "You're offline. Reconnect to delete this profile."
          : "We couldn't delete this profile right now. Please try again."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="screen screen-narrow account-page" aria-labelledby="edit-child-title">
      <ScreenHeader id="edit-child-title" title="Edit child" childScoped={false} />
      <ChildStatusNotice status={status} onRetry={refresh} hasChildren={children.length > 0} />
      {status === "ready" && !child && (
        <InlineAlert kind="error" title="We can't open this profile.">
          It may have been deleted. Your own notes are safe.
        </InlineAlert>
      )}
      {child && (
        <>
          <ChildForm
            key={child.id}
            child={child}
            online={online}
            onCancel={back}
            onSubmit={async (input) => {
              const saved = await editChild(child.id, input);
              navigate("/children", { state: noticeState(savedMessage(saved.nickname)) });
            }}
          />

          {removeChild && (
            <Card as="section" aria-labelledby="delete-child-heading">
              <h2 id="delete-child-heading">Remove child profile</h2>
              <p className="account-note">
                Permanently deletes {child.nickname}&apos;s profile, activity plans, milestone notes, saved books, and journal notes.
              </p>
              {deleteError && (
                <InlineAlert kind="error" title="Profile not deleted">
                  <p>{deleteError}</p>
                </InlineAlert>
              )}
              <div className="account-action">
                <Button
                  variant="danger"
                  disabled={!online || deleting}
                  onClick={() => setConfirmDeleteOpen(true)}
                >
                  Delete {child.nickname}&apos;s profile
                </Button>
              </div>
            </Card>
          )}

          <ConfirmDialog
            open={confirmDeleteOpen}
            title={`Delete ${child.nickname}'s profile?`}
            confirmLabel={deleting ? "Deleting…" : "Delete profile"}
            destructive
            onConfirm={() => void handleDelete()}
            onCancel={() => setConfirmDeleteOpen(false)}
          >
            <p>
              This permanently removes {child.nickname}&apos;s profile, plans, milestone observations, saved books, and private journal notes. This cannot be undone.
            </p>
          </ConfirmDialog>
        </>
      )}
      <Link className="text-button" to="/children">
        Back to your children
      </Link>
    </section>
  );
}
