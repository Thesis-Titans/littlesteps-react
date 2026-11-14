import { useState } from "react";
import { Button, Chip, EmptyState, InlineAlert, Select, Skeleton } from "../../../components/common";
import { AGE_BANDS, ageBandLabel, type AgeBand, type Child } from "../../children";
import { DOMAIN_LABELS, type Domain } from "../../catalog/types";
import { groupByDomain, latestByPrompt } from "../logic";
import { promptsFor } from "../prompts";
import { useObservations } from "../useObservations";
import { PromptRow } from "./PromptRow";

const LIST_LIMIT = 100;

type DomainFilter = Domain | "all";

const DOMAIN_CHIPS: { id: DomainFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "cognitive", label: "Thinking" },
  { id: "motor", label: "Moving" },
  { id: "language", label: "Talking" },
  { id: "socioEmotional", label: "Feelings" },
];

/** Prompts for the child's age, grouped by kind of play. Remount per child (key) so state starts clean. */
export function MilestonesList({ child }: { child: Child }) {
  const { status, observations, reload, put } = useObservations(child.id);
  const [ageBand, setAgeBand] = useState<AgeBand>(child.ageBand);
  const [selectedDomain, setSelectedDomain] = useState<DomainFilter>("all");
  const [editingId, setEditingId] = useState<string>();

  const retry = <Button variant="secondary" onClick={reload}>Retry</Button>;
  if (status === "loading") return <Skeleton kind="card" label="Loading milestones…" />;
  if (status === "offline") {
    return <InlineAlert kind="offline" title="You're offline." action={retry}>We can't load milestones right now. Reconnect and try again.</InlineAlert>;
  }
  if (status === "unauthorized") {
    return <InlineAlert kind="error" title="Please sign in again to continue">Your session has ended. Your saved notes are safe.</InlineAlert>;
  }
  if (status === "error") {
    // INTERNAL_ERROR and any other failure: no technical detail on screen.
    return <InlineAlert kind="error" title="We couldn't load milestones." action={retry}>Try again. Your saved notes are safe.</InlineAlert>;
  }

  const seen = latestByPrompt(observations);
  const allPrompts = promptsFor(ageBand);
  const groups = groupByDomain(allPrompts);
  const filteredGroups = selectedDomain === "all" ? groups : groups.filter((g) => g.domain === selectedDomain);

  return (
    <div className="milestones-screen">
      <div className="milestone-controls">
        <Select
          label="Child's age"
          value={ageBand}
          onChange={(e) => {
            setAgeBand(e.target.value as AgeBand);
            setEditingId(undefined);
          }}
          options={AGE_BANDS.map((band) => ({ value: band, label: ageBandLabel(band) }))}
        />

        {/* Domain filter chips (react #47) */}
        <div className="milestone-domain-chips" role="group" aria-label="Developmental domain filters">
          {DOMAIN_CHIPS.map((chip) => {
            const isSelected = selectedDomain === chip.id;
            return (
              <Chip
                key={chip.id}
                selected={isSelected}
                onClick={() => setSelectedDomain(chip.id)}
                aria-pressed={isSelected}
              >
                {chip.label}
              </Chip>
            );
          })}
        </div>
      </div>

      {/* shortcut: the API list returns at most 100 records (api #42); tell the caregiver instead of dropping silently. */}
      {observations.length >= LIST_LIMIT && (
        <InlineAlert kind="info" title="Some older notes may not show here">This page can show up to {LIST_LIMIT} notes.</InlineAlert>
      )}

      {filteredGroups.length === 0 && (
        <EmptyState title="Nothing noted yet">Look for small moments during play. Things to look for at this age will show here.</EmptyState>
      )}

      <div className="milestones-desktop-layout">
        {/* Main Column */}
        <div className="milestones-main-col">
          {filteredGroups.map(({ domain, prompts }) => (
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
        </div>

        {/* Desktop Side Panel (react #47) */}
        <aside className="milestones-side-col" aria-label="Milestones guidance">
          <div className="milestone-side-panel">
            <h3 style={{ margin: 0, font: "var(--font-h3)" }}>Notice, don&apos;t score</h3>
            <p style={{ margin: 0, font: "var(--font-body-small)", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
              These prompts show small moments to look for during everyday play with {child.nickname}. They are not tests or milestones your child must reach on a set schedule.
            </p>
            <div className="milestone-calm-box" style={{ width: "100%" }}>
              <p>This saves one moment from one day. It isn&apos;t a test.</p>
            </div>
            <div style={{ borderTop: "1px solid var(--color-border-subtle)", paddingTop: "var(--space-12)" }}>
              <p style={{ margin: 0, font: "var(--font-meta)", color: "var(--color-text-secondary)" }}>
                🔒 <strong>Private observations.</strong> Only you can see notes you record here.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
