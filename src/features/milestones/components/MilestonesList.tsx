import { useState } from "react";
import {
  Button,
  EmptyState,
  FilterChips,
  Icon,
  InlineAlert,
  Select,
  SessionExpiredAlert,
  Skeleton,
} from "../../../components/common";
import { TwoColumnLayout } from "../../../components/layout";
import { DOMAINS, DOMAIN_LABELS, type Domain } from "../../catalog/types";
import { AGE_BANDS, ageBandLabel, type AgeBand, type Child } from "../../children";
import { groupByDomain, latestByPrompt } from "../logic";
import { useMilestonePrompts } from "../useMilestonePrompts";
import { useObservations } from "../useObservations";
import { PromptRow } from "./PromptRow";

const LIST_LIMIT = 100;

type DomainFilter = Domain | "all";

const DOMAIN_CHIPS: { id: DomainFilter; label: string }[] = [
  { id: "all", label: "All" },
  ...DOMAINS.map((domain) => ({ id: domain, label: DOMAIN_LABELS[domain] })),
];

/** Prompts for the child's age, grouped by kind of play. Remount per child (key) so state starts clean. */
export function MilestonesList({ child }: { child: Child }) {
  const { status, observations, reload, put } = useObservations(child.id);
  const [ageBand, setAgeBand] = useState<AgeBand>(child.ageBand);
  const [selectedDomain, setSelectedDomain] = useState<DomainFilter>("all");
  const [editingId, setEditingId] = useState<string>();
  const allPrompts = useMilestonePrompts(ageBand);

  const retry = <Button variant="secondary" onClick={reload}>Retry</Button>;
  if (status === "loading") return <Skeleton kind="card" label="Loading milestones…" />;
  if (status === "offline") {
    return (
      <InlineAlert kind="offline" title="You're offline." action={retry}>
        We can&apos;t load milestones right now. Reconnect and try again.
      </InlineAlert>
    );
  }
  if (status === "unauthorized") {
    return <SessionExpiredAlert />;
  }
  if (status === "error") {
    return (
      <InlineAlert kind="error" title="We couldn't load milestones." action={retry}>
        Try again. Your saved notes are safe.
      </InlineAlert>
    );
  }

  const seen = latestByPrompt(observations);
  const groups = groupByDomain(allPrompts);
  const filteredGroups =
    selectedDomain === "all" ? groups : groups.filter((g) => g.domain === selectedDomain);

  return (
    <div className="milestones-screen">
      <div className="ls-filter-bar milestone-controls">
        <div className="milestone-age-select">
          <Select
            label="Child's age"
            value={ageBand}
            onChange={(e) => {
              setAgeBand(e.target.value as AgeBand);
              setEditingId(undefined);
            }}
            options={AGE_BANDS.map((band) => ({ value: band, label: ageBandLabel(band) }))}
          />
        </div>

        <FilterChips
          label="Kind of play"
          ariaLabel="Kind of play filters"
          options={DOMAIN_CHIPS}
          selected={selectedDomain}
          onToggle={setSelectedDomain}
          className="milestone-domain-chips"
        />
      </div>

      {/* The observations endpoint caps responses at 100 items; tell the caregiver instead of dropping silently. */}
      {observations.length >= LIST_LIMIT && (
        <InlineAlert kind="info" title="Some older notes may not show here">
          This page can show up to {LIST_LIMIT} notes.
        </InlineAlert>
      )}

      {filteredGroups.length === 0 && (
        <EmptyState title="Nothing noted yet">
          Look for small moments during play. Things to look for at this age will show here.
        </EmptyState>
      )}

      <TwoColumnLayout
        hideAsideOnMobile
        asideLabel="Milestones guidance"
        main={
          <>
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
          </>
        }
        aside={
          <div className="milestone-side-panel">
            <h3 className="milestone-side-title">Notice, don&apos;t score</h3>
            <p className="milestone-side-body">
              These prompts show small moments to look for during everyday play with {child.nickname}. They are not tests or milestones your child must reach on a set schedule.
            </p>
            <div className="milestone-calm-box milestone-side-calm">
              <p>This saves one moment from one day. It isn&apos;t a test.</p>
            </div>
            <div className="milestone-side-privacy">
              <p className="milestone-side-privacy-text">
                <Icon name="lock" size={14} />
                <span>
                  <strong>Private notes.</strong> Only you can see notes you record here.
                </span>
              </p>
            </div>
          </div>
        }
      />
    </div>
  );
}
