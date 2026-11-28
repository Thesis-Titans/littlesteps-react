import { Button, Card, Icon } from "../../../components/common";

export interface IdeaHelperBannerProps {
  childNickname?: string;
  onOpen: () => void;
}

/** Compact one-row callout inviting caregivers to open the AI Idea Helper on Explore. */
export function IdeaHelperBanner({ childNickname, onOpen }: IdeaHelperBannerProps) {
  const childLabel = childNickname ?? "your child";
  return (
    <Card as="section" className="idea-helper-banner" aria-label="Need a play idea?">
      <div className="idea-helper-banner-content">
        <Icon name="sparkle" size={20} className="idea-helper-banner-icon" />
        <div className="idea-helper-banner-text">
          <h2 className="idea-helper-banner-title">Need a play idea?</h2>
          <p className="idea-helper-banner-subtitle">
            Match time, setting, and everyday items for {childLabel}.
          </p>
        </div>
      </div>
      <Button variant="secondary" onClick={onOpen} className="idea-helper-banner-btn">
        Get a play idea
      </Button>
    </Card>
  );
}
