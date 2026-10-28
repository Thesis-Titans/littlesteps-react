import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Badge, Button, Chip, ConfirmDialog, Icon, InlineAlert, Skeleton, TextField } from "./index";
import { createDismissTimer, MIN_TOAST_MS } from "./dismissTimer";

describe("TextField", () => {
  it("links the error message and marks the field invalid", () => {
    const html = renderToStaticMarkup(<TextField label="Nickname" defaultValue="" error="Please add a nickname." />);
    const describedBy = html.match(/aria-describedby="([^"]+)"/)?.[1];
    expect(html).toContain('aria-invalid="true"');
    expect(describedBy).toBeDefined();
    expect(html).toContain(`id="${describedBy}"`);
    expect(html).toContain("Please add a nickname.");
  });

  it("is valid with no error and shows the character count", () => {
    const html = renderToStaticMarkup(<TextField label="Note" multiline maxLength={500} value="Hello" onChange={() => {}} />);
    expect(html).not.toContain("aria-invalid");
    expect(html).toContain("<textarea");
    expect(html).toContain("5 / 500");
  });
});

describe("Button", () => {
  it("disables itself and announces busy while an action runs", () => {
    const html = renderToStaticMarkup(<Button busy>Saving…</Button>);
    expect(html).toContain("disabled");
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('type="button"');
  });
});

describe("Chip", () => {
  it("exposes its selected state as a toggle", () => {
    expect(renderToStaticMarkup(<Chip selected>All</Chip>)).toContain('aria-pressed="true"');
    expect(renderToStaticMarkup(<Chip>Moving</Chip>)).toContain('aria-pressed="false"');
  });
});

describe("InlineAlert", () => {
  it("interrupts only for errors", () => {
    expect(renderToStaticMarkup(<InlineAlert kind="error" title="Didn't save" />)).toContain('role="alert"');
    expect(renderToStaticMarkup(<InlineAlert kind="offline" title="You're offline" />)).toContain('role="status"');
  });
});

describe("Badge", () => {
  it("labels AI output with the agreed wording", () => {
    expect(renderToStaticMarkup(<Badge kind="ai" />)).toContain("Suggested by AI");
  });
});

describe("Icon", () => {
  it("follows the text color and is hidden from screen readers unless labelled", () => {
    const decorative = renderToStaticMarkup(<Icon name="lock" />);
    expect(decorative).toContain('stroke="currentColor"');
    expect(decorative).toContain('aria-hidden="true"');
    expect(renderToStaticMarkup(<Icon name="close" label="Close" />)).toContain('aria-label="Close"');
  });
});

describe("Skeleton", () => {
  it("announces its label and hides the shapes", () => {
    const html = renderToStaticMarkup(<Skeleton label="Loading notes…" />);
    expect(html).toContain('role="status"');
    expect(html).toContain("Loading notes…");
    expect(html).toContain('aria-hidden="true"');
  });
});

describe("ConfirmDialog", () => {
  it("names the action and is labelled by its title", () => {
    const html = renderToStaticMarkup(
      <ConfirmDialog open={false} title="Delete this private note?" confirmLabel="Delete note" destructive onConfirm={() => {}} onCancel={() => {}}>
        <p>This cannot be undone.</p>
      </ConfirmDialog>
    );
    const labelledBy = html.match(/aria-labelledby="([^"]+)"/)?.[1];
    expect(html).toContain(`id="${labelledBy}"`);
    expect(html).toContain("Delete note");
    expect(html).toContain("ls-button-danger");
  });
});

describe("createDismissTimer", () => {
  afterEach(() => vi.useRealTimers());

  it("never closes before 10 seconds", () => {
    vi.useFakeTimers();
    const done = vi.fn();
    createDismissTimer(3_000, done);
    vi.advanceTimersByTime(MIN_TOAST_MS - 1);
    expect(done).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(done).toHaveBeenCalledOnce();
  });

  it("pauses and resumes with the time that was left", () => {
    vi.useFakeTimers();
    const done = vi.fn();
    const timer = createDismissTimer(MIN_TOAST_MS, done);
    vi.advanceTimersByTime(4_000);
    timer.pause();
    vi.advanceTimersByTime(60_000);
    expect(done).not.toHaveBeenCalled();
    timer.resume();
    vi.advanceTimersByTime(5_999);
    expect(done).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(done).toHaveBeenCalledOnce();
  });

  it("does nothing after clear", () => {
    vi.useFakeTimers();
    const done = vi.fn();
    createDismissTimer(MIN_TOAST_MS, done).clear();
    vi.advanceTimersByTime(MIN_TOAST_MS * 2);
    expect(done).not.toHaveBeenCalled();
  });
});
