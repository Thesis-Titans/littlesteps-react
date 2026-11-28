import { useId } from "react";
import { Badge, Button, Icon, ModalDialog } from "../../../components/common";
import { NON_DIAGNOSTIC_PLAY_DISCLAIMER, openLibraryWorkUrl } from "../../../config/externalLinks";
import type { BookItem } from "../../catalog/types";

export interface StoryCompanionIdea {
  title: string;
  domain: string;
  instructions: string;
  safetyNotice: string;
  badge?: string | null;
}

export interface StoryPlayIdeaDialogProps {
  book: BookItem | null;
  loading: boolean;
  idea: StoryCompanionIdea | null;
  childNickname?: string;
  canPlan: boolean;
  onClose: () => void;
  onPlanStorybook: () => void;
}

/**
 * Modal dialog displaying a story companion play idea with Open Library borrow and plan actions.
 */
export function StoryPlayIdeaDialog({
  book,
  loading,
  idea,
  childNickname,
  canPlan,
  onClose,
  onPlanStorybook,
}: StoryPlayIdeaDialogProps) {
  const titleId = useId();
  const childLabel = childNickname ?? "your child";

  return (
    <ModalDialog
      open={book !== null}
      labelledBy={titleId}
      className="storybook-play-dialog"
      onClose={onClose}
    >
      {book && (
        <>
          <div className="storybook-dialog-header">
            <h2 id={titleId} className="ls-dialog-title">
              Play idea for {book.title}
            </h2>
            <Badge kind="ai" />
          </div>

          <div className="ls-dialog-body storybook-dialog-body">
            <p className="idea-helper-guidance">
              You know your child best. Change it as you like, and stay close while you play.
            </p>

            {loading ? (
              <div className="storybook-companion-loading" role="status">
                <p>Finding a play idea for this book… This usually takes a few seconds.</p>
              </div>
            ) : (
              <article className="storybook-companion-card">
                <h3 className="storybook-companion-title">
                  {idea?.title ?? "Interactive Story & Puppet Play"}
                </h3>
                <p className="storybook-companion-desc">
                  {idea?.instructions ??
                    `As you read ${book.title}, use hands or everyday household toys to act out character motions and sounds. Invite ${childLabel} to point to pictures as you name them.`}
                </p>
                <div className="storybook-companion-safety">
                  <strong>Safety reminder:</strong>{" "}
                  {idea?.safetyNotice ??
                    "Always stay close during play and ensure small objects are kept out of reach."}
                </div>
              </article>
            )}

            <p className="idea-helper-disclaimer">{NON_DIAGNOSTIC_PLAY_DISCLAIMER}</p>
          </div>

          <div className="ls-dialog-actions storybook-dialog-actions">
            {book.id ? (
              <a
                href={openLibraryWorkUrl(book.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="ls-button ls-button-secondary storybook-borrow-link"
                aria-label={`Read or borrow ${book.title} on Open Library (opens in new tab)`}
              >
                <Icon name="book" size={16} />
                <span>Read or borrow</span>
                <span aria-hidden="true">↗</span>
              </a>
            ) : (
              <span />
            )}
            <div className="storybook-dialog-buttons">
              <Button variant="secondary" onClick={onClose}>
                Done
              </Button>
              {canPlan && (
                <Button variant="primary" onClick={onPlanStorybook}>
                  Add to today&apos;s plan
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </ModalDialog>
  );
}
