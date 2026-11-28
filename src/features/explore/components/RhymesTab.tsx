import { useEffect, useState } from "react";
import { Badge, Button, Card, InlineAlert } from "../../../components/common";
import { fetchCatalogRhymes } from "../../catalog/api";
import { PHILIPPINE_RHYMES, type PhilippineRhyme } from "../data/philippineRhymes";

export interface RhymesTabProps {
  onPlanRhyme?: (rhyme: PhilippineRhyme) => void;
}

/**
 * In-app Philippine nursery rhymes shelf, loading live catalog rhymes with local fallback.
 */
export function RhymesTab({ onPlanRhyme }: RhymesTabProps) {
  const [rhymes, setRhymes] = useState<PhilippineRhyme[]>(PHILIPPINE_RHYMES);

  useEffect(() => {
    let active = true;
    fetchCatalogRhymes()
      .then((data) => {
        if (!active || !data.items || data.items.length === 0) return;
        setRhymes(data.items);
      })
      .catch(() => {
        // Keep the bundled traditional Philippine rhymes when offline or unavailable.
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="philippine-rhymes-shelf">
      <div className="rhymes-intro">
        <p>
          No physical book at home? Read, recite, and sing these classic Philippine nursery rhymes together with interactive action cues!
        </p>
      </div>

      <InlineAlert kind="info" title="Traditional Philippine Nursery Rhymes">
        <p>Everyday play and bonding rhymes grounded in Philippine early childhood traditions. Play ideas only — not a medical or developmental test.</p>
      </InlineAlert>

      <div className="storybooks-grid">
        {rhymes.map((rhyme) => (
          <Card key={rhyme.id} as="article" className="storybook-card rhyme-card">
            <div className="rhyme-body">
              <div className="rhyme-meta">
                <span className="storybook-subject-tag">{rhyme.domainLabel}</span>
                <span className="rhyme-duration">{rhyme.durationMinutes} mins</span>
              </div>

              <div className="rhyme-badge">
                <Badge kind="source">Traditional Philippine Rhyme</Badge>
              </div>

              <h3 className="storybook-title">{rhyme.title}</h3>
              <p className="storybook-author">{rhyme.subtitle}</p>

              <div className="rhyme-lyrics">
                {rhyme.lyrics.map((line, idx) => (
                  <div key={idx}>{line}</div>
                ))}
              </div>

              <p className="rhyme-cue">
                <strong>Action cue:</strong> {rhyme.actionPrompt}
              </p>
            </div>

            <div className="rhyme-actions">
              {onPlanRhyme && (
                <Button variant="secondary" fullWidth onClick={() => onPlanRhyme(rhyme)}>
                  Add to today&apos;s plan
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
