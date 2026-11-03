import { useState } from "react";
import { Button, EmptyState, InlineAlert, Select, Skeleton } from "../../../components/common";
import { AGE_BANDS, ageBandLabel, type AgeBand, type Child } from "../../children";
import { DOMAIN_LABELS } from "../../catalog/types";
import { groupByDomain, latestByPrompt } from "../logic";
import { promptsFor } from "../prompts";
import { useObservations } from "../useObservations";
import { PromptRow } from "./PromptRow";

/** Prompts for the child's age, grouped by kind of play. Remount per child (key) so state starts clean. */
export function MilestonesList({ child }: { child: Child }) {
  const { status, observations, reload, put } = useObservations(child.id);
  const [ageBand, setAgeBand] = useState<AgeBand>(child.ageBand);
  const [editingId, setEditingId] = useState<string>();

  const retry = <Button variant="secondary" onClick={reload}>Retry</Button>;
  if (status === "loading") return <Skeleton kind="card" label="Loading milestones…" />;
  if (status === "offline") {
    return <InlineAlert kind="offline" title="You're offline." action={retry}>We can't load milestones right now. Reconnect and try again.</InlineAlert>;
  }
  if (status === "error") {
    // INTERNAL_ERROR and any other failure: no technical detail on screen.
    return <InlineAlert kind="error" title="We couldn't load milestones." action={retry}>Try again. Your saved notes are safe.</InlineAlert>;
  }

  const seen = latestByPrompt(observations);
  const groups = groupByDomain(promptsFor(ageBand));
  return (
    <>
      <Select
        label="Child's age"
        value={ageBand}
        onChange={(e) => {
          setAgeBand(e.target.value as AgeBand);
          setEditingId(undefined);
        }}
        options={AGE_BANDS.map((band) => ({ value: band, label: ageBandLabel(band) }))}
      />
      {groups.length === 0 && (
        <EmptyState title="Nothing noted yet">Look for small moments during play. Things to look for at this age will show here.</EmptyState>
      )}
      {groups.map(({ domain, prompts }) => (
        <section key={domain} className="milestone-group" aria-labelledby={`group-${domain}`}>
          <h2 id={`group-${domain}`}>{DOMAIN_LABELS[domain]}</h2>
          <ul className="milestone-list">
            {prompts.map((prompt) => (
              <PromptRow
                key={prompt.id}
                childId={child.id}
                childName={child.nickname}
                prompt={prompt}
                observation={seen.get(prompt.id)}
                editing={editingId === prompt.id}
                onEdit={() => setEditingId(prompt.id)}
                onClose={() => setEditingId(undefined)}
                onSaved={(o) => {
                  put(o);
                  setEditingId(undefined);
                }}
              />
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
