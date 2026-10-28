import { useState, type ReactNode } from "react";
import {
  Badge, Button, Card, Chip, ConfirmDialog, EmptyState, Icon, InlineAlert, Select, Skeleton, TextField, UndoToast,
  type IconName,
} from "../components/common";

const ICONS: IconName[] = [
  "today", "explore", "milestones", "journal", "this-week", "lock", "check", "clock",
  "info", "sparkle", "chevron-down", "chevron-right", "close", "plus", "wifi-off",
];
const AGES = [
  { value: "12-23", label: "12–23 months" },
  { value: "24-35", label: "24–35 months" },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="showcase-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="showcase-row">
      <p className="showcase-label">{label}</p>
      <div className="showcase-items">{children}</div>
    </div>
  );
}

/** Every shared component in every state. Dev builds only: open /dev/components. */
export function ComponentShowcase() {
  const [note, setNote] = useState("Maya stacked two cups by herself today.");
  const [chip, setChip] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toast, setToast] = useState(false);

  return (
    <main className="showcase">
      <header>
        <h1>LittleSteps components</h1>
        <p>Shared components from <code>src/components/common</code>. Rows marked "Focus" show the focus ring; press Tab to see it live. See <code>src/components/README.md</code> for when to use each one.</p>
      </header>

      <Section title="Button">
        <Row label="Default">
          <Button>Save</Button>
          <Button variant="secondary">Cancel</Button>
          <Button variant="text">Forgot password?</Button>
          <Button variant="danger">Delete note</Button>
        </Row>
        <Row label="Focus">
          <div data-focus-preview className="showcase-items"><Button>Save</Button><Button variant="secondary">Cancel</Button></div>
        </Row>
        <Row label="Disabled and busy">
          <Button disabled>Save</Button>
          <Button busy>Saving…</Button>
        </Row>
      </Section>

      <Section title="TextField">
        <div className="showcase-grid">
          <TextField label="Nickname" placeholder="e.g. Maya" hint="A nickname is enough. No surname needed." />
          <div data-focus-preview><TextField label="Focus" defaultValue="Maya" /></div>
          <TextField label="Nickname" defaultValue="" error="Please add a nickname." />
          <TextField label="Disabled" defaultValue="Not available" disabled />
          <TextField label="Note (optional)" multiline maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} />
        </div>
      </Section>

      <Section title="Select">
        <div className="showcase-grid">
          <Select label="Child's age" options={AGES} />
          <div data-focus-preview><Select label="Focus" options={AGES} /></div>
          <Select label="Child's age" options={AGES} error="Pick a month and year, or choose an age range instead." />
          <Select label="Disabled" options={AGES} disabled />
        </div>
      </Section>

      <Section title="Chip">
        <Row label="Default and selected">
          <Chip selected={chip} onClick={() => setChip((on) => !on)}>All</Chip>
          <Chip>Thinking</Chip>
          <Chip>Moving</Chip>
        </Row>
        <Row label="Focus and disabled">
          <div data-focus-preview><Chip>Talking</Chip></div>
          <Chip disabled>Feelings</Chip>
        </Row>
      </Section>

      <Section title="Card">
        <div className="showcase-grid">
          <Card>Plain card for content inside another surface.</Card>
          <Card elevated>Elevated card that sits on the page background.</Card>
        </div>
      </Section>

      <Section title="Badge">
        <Row label="Kinds">
          <Badge kind="source" />
          <Badge kind="completed" />
          <Badge kind="ai" />
          <Badge kind="private" />
          <Badge kind="offline" />
        </Row>
      </Section>

      <Section title="InlineAlert">
        <div className="showcase-grid">
          <InlineAlert kind="error" title="This note is too long" action={<Button variant="secondary">Retry</Button>}>
            <p>Notes can be up to 2,000 characters. Please make this one a little shorter.</p>
          </InlineAlert>
          <InlineAlert kind="offline" title="You're offline. Your note wasn't saved." action={<Button variant="secondary">Retry</Button>}>
            <p>Your draft is still here. Tap Retry when you're back online.</p>
          </InlineAlert>
          <InlineAlert kind="info" title="Showing books we saved earlier">
            <p>New books will appear when the online library is back.</p>
          </InlineAlert>
          <InlineAlert kind="caution" title="The idea helper isn't working right now">
            <p>Here are a few favorites for Maya's age from our activity list.</p>
          </InlineAlert>
        </div>
      </Section>

      <Section title="Skeleton">
        <div className="showcase-grid">
          <Skeleton kind="card" label="Loading activities…" />
          <Skeleton kind="row" label="Loading milestones…" />
          <Skeleton kind="profile" label="Loading children…" />
        </div>
      </Section>

      <Section title="EmptyState">
        <EmptyState title="Nothing noted yet" action={<Button>Write a note</Button>}>
          <p>Look for small moments during play.</p>
        </EmptyState>
      </Section>

      <Section title="ConfirmDialog">
        <div className="showcase-items"><Button variant="danger" onClick={() => setDialogOpen(true)}>Open delete dialog</Button></div>
        <ConfirmDialog
          open={dialogOpen}
          title="Delete this private note?"
          confirmLabel="Delete note"
          destructive
          onConfirm={() => setDialogOpen(false)}
          onCancel={() => setDialogOpen(false)}
        >
          <p>This will permanently delete this private note. Your child's profile and other records will not be deleted.</p>
          <p>This cannot be undone.</p>
        </ConfirmDialog>
      </Section>

      <Section title="UndoToast">
        <div className="showcase-items"><Button variant="secondary" onClick={() => setToast(true)}>Mark complete</Button></div>
        {toast && <UndoToast message="Marked complete" onUndo={() => setToast(false)} onClose={() => setToast(false)} />}
      </Section>

      <Section title="Icon">
        <Row label="20px, inherits text color">
          {ICONS.map((name) => (
            <span key={name} className="showcase-icon"><Icon name={name} />{name}</span>
          ))}
        </Row>
      </Section>

      <style>{`
        .showcase { max-width: 1040px; margin: 0 auto; padding: var(--space-32) var(--space-16); display: grid; gap: var(--space-32); }
        .showcase h1 { font: var(--font-display-desktop); margin: 0 0 var(--space-8); }
        .showcase header p { font: var(--font-body); color: var(--color-text-secondary); margin: 0; }
        .showcase-section { display: grid; gap: var(--space-16); }
        .showcase-section > h2 { font: var(--font-h2-desktop); margin: 0; }
        .showcase-row { display: grid; gap: var(--space-8); }
        .showcase-label { font: var(--font-meta); color: var(--color-text-secondary); margin: 0; }
        .showcase-items { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-12); }
        .showcase-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-16); align-items: start; }
        .showcase-icon { display: inline-flex; align-items: center; gap: var(--space-8); font: var(--font-meta); color: var(--color-text-secondary); }
      `}</style>
    </main>
  );
}
