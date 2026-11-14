// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, UnauthorizedError } from "../../services/api";
import type { Child } from "../children";
import * as api from "./api";
import { Advisory } from "./components/Advisory";
import { MilestonesList } from "./components/MilestonesList";
import type { MilestoneObservation } from "./types";

vi.mock("../../services/firebase", () => ({ auth: {} }));

const child: Child = { id: "6f1c344e-84a8-4e24-9d72-74739a8c1362", nickname: "Maya", ageBand: "12-23m", createdAt: "2026-10-29T08:00:00Z", updatedAt: "2026-10-29T08:00:00Z" };
const obs = (over: Partial<MilestoneObservation> = {}): MilestoneObservation => ({
  id: "0b9f6a2e-1111-4222-8333-444455556666",
  childId: child.id,
  milestoneId: "fx-cog-12-23m-01",
  status: "observed",
  observedDate: "2026-10-21",
  createdAt: "2026-10-21T08:00:00Z",
  updatedAt: "2026-10-21T08:00:00Z",
  ...over,
});
const BANNED = /\b(delayed|delay|behind|on track|score|scores|pass|fail|failed)\b/i;
const setOnline = (online: boolean) => vi.spyOn(navigator, "onLine", "get").mockReturnValue(online);

async function ready(list: MilestoneObservation[] = []) {
  vi.spyOn(api, "listObservations").mockResolvedValue(list);
  render(<MilestonesList child={child} />);
  await screen.findByRole("heading", { name: "Thinking" });
}
const openForm = (user: ReturnType<typeof userEvent.setup>, name: RegExp) => user.click(screen.getAllByRole("button", { name })[0]);

describe("MilestonesList", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setOnline(true);
  });
  afterEach(cleanup);

  it("shows a loading line, then prompts grouped by kind of play with status, source and review", async () => {
    vi.spyOn(api, "listObservations").mockResolvedValue([obs()]);
    render(<MilestonesList child={child} />);
    expect(screen.getByRole("status").textContent).toBe("Loading milestones…");
    for (const name of ["Thinking", "Moving", "Talking", "Feelings"]) await screen.findByRole("heading", { name });
    expect(screen.getByText("Seen on Oct 21, 2026")).toBeTruthy();
    expect(screen.getAllByText("Not seen yet")).toHaveLength(7);
    expect(screen.getAllByText(/Source: early learning guide · still being checked/).length).toBe(8);
    expect(screen.getAllByText("Sample wording, not reviewed").length).toBe(8);
  });

  it("uses no banned words anywhere on screen", async () => {
    await ready([obs()]);
    await userEvent.setup().click(screen.getAllByRole("button", { name: /Note what you saw/ })[0]);
    expect(document.body.textContent).not.toMatch(BANNED);
  });

  it("shows an empty state when the age has no prompts", async () => {
    vi.spyOn(api, "listObservations").mockResolvedValue([]);
    render(<MilestonesList child={{ ...child, ageBand: "60-71m" }} />);
    expect(await screen.findByText("Nothing noted yet")).toBeTruthy();
  });

  it("records a note, naming the child, and updates the row", async () => {
    const user = userEvent.setup();
    await ready();
    const record = vi.spyOn(api, "recordObservation").mockImplementation(async (_c, id, input) => obs({ milestoneId: id, ...input }));
    await openForm(user, /Note what you saw: Finds a hidden toy/);
    expect(screen.getByRole("heading", { name: "Note what you saw for Maya" })).toBeTruthy();
    const date = screen.getByLabelText(/^Date/);
    await user.clear(date);
    await user.type(date, "2026-10-21");
    await user.type(screen.getByLabelText(/Note \(optional\)/), "Under the blue cloth");
    await user.click(screen.getByRole("button", { name: "Save note" }));
    await waitFor(() => expect(record).toHaveBeenCalledWith(child.id, "fx-cog-12-23m-01", { status: "observed", observedDate: "2026-10-21", notes: "Under the blue cloth" }));
    expect(await screen.findByText("Seen on Oct 21, 2026")).toBeTruthy();
    expect(screen.queryByRole("form")).toBeNull();
  });

  it("limits the note to 500 characters", async () => {
    const user = userEvent.setup();
    await ready();
    await openForm(user, /Note what you saw/);
    expect((screen.getByLabelText(/Note \(optional\)/) as HTMLTextAreaElement).maxLength).toBe(500);
  });

  it("requires a date and does not call the API without one", async () => {
    const user = userEvent.setup();
    await ready();
    const record = vi.spyOn(api, "recordObservation");
    await openForm(user, /Note what you saw/);
    await user.clear(screen.getByLabelText(/^Date/));
    await user.click(screen.getByRole("button", { name: "Save note" }));
    expect(screen.getByText("Choose the date you saw it.")).toBeTruthy();
    expect(record).not.toHaveBeenCalled();
  });

  it("edits an existing record with the record id", async () => {
    const user = userEvent.setup();
    await ready([obs({ notes: "First try" })]);
    const update = vi.spyOn(api, "updateObservation").mockResolvedValue(obs({ status: "not_yet_observed" }));
    await openForm(user, /Edit note: Finds a hidden toy/);
    expect((screen.getByLabelText(/Note \(optional\)/) as HTMLTextAreaElement).value).toBe("First try");
    await user.selectOptions(screen.getByLabelText("What did you see?"), "not_yet_observed");
    await user.click(screen.getByRole("button", { name: "Save note" }));
    await waitFor(() => expect(update).toHaveBeenCalledWith(child.id, obs().id, { status: "not_yet_observed", observedDate: "2026-10-21", notes: "First try" }));
    await waitFor(() => expect(screen.queryByText("Seen on Oct 21, 2026")).toBeNull());
  });

  it("keeps typed text and offers Retry when offline", async () => {
    const user = userEvent.setup();
    await ready();
    const record = vi.spyOn(api, "recordObservation").mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await openForm(user, /Note what you saw/);
    await user.type(screen.getByLabelText(/Note \(optional\)/), "Walked to the door");
    setOnline(false);
    await user.click(screen.getByRole("button", { name: "Save note" }));
    const alert = await screen.findByText("You're offline. Your note wasn't saved.");
    expect(within(alert.closest("[role=status]") as HTMLElement).getByRole("button", { name: "Retry" })).toBeTruthy();
    expect((screen.getByLabelText(/Note \(optional\)/) as HTMLTextAreaElement).value).toBe("Walked to the door");
    setOnline(true);
    record.mockImplementation(async (_c, id, input) => obs({ milestoneId: id, ...input }));
    await user.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(record).toHaveBeenCalledTimes(2));
    expect(record.mock.calls[1][2].notes).toBe("Walked to the door");
  });

  it("shows no technical detail when saving fails with INTERNAL_ERROR", async () => {
    const user = userEvent.setup();
    await ready();
    vi.spyOn(api, "recordObservation").mockRejectedValue(new ApiError(500, "INTERNAL_ERROR", "TypeError at store.ts:42 stack trace"));
    await openForm(user, /Note what you saw/);
    await user.type(screen.getByLabelText(/Note \(optional\)/), "Kept");
    await user.click(screen.getByRole("button", { name: "Save note" }));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("We couldn't save your note.");
    expect(document.body.textContent).not.toMatch(/INTERNAL_ERROR|stack trace|store\.ts|HTTP 500/);
    expect((screen.getByLabelText(/Note \(optional\)/) as HTMLTextAreaElement).value).toBe("Kept");
  });

  it("shows a safe error with Retry when the list fails, then recovers", async () => {
    const user = userEvent.setup();
    const list = vi.spyOn(api, "listObservations").mockRejectedValueOnce(new ApiError(500, "INTERNAL_ERROR", "db password leaked"));
    render(<MilestonesList child={child} />);
    expect((await screen.findByRole("alert")).textContent).not.toMatch(/INTERNAL_ERROR|leaked/);
    list.mockResolvedValue([]);
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByRole("heading", { name: "Thinking" })).toBeTruthy();
  });

  it("shows the offline state when the list cannot load offline", async () => {
    setOnline(false);
    vi.spyOn(api, "listObservations").mockRejectedValue(new TypeError("Failed to fetch"));
    render(<MilestonesList child={child} />);
    expect(await screen.findByText("You're offline.")).toBeTruthy();
  });
});

describe("Advisory", () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it("shows in full on the first visit, then as a persistent link that reopens it", async () => {
    const user = userEvent.setup();
    render(<Advisory />);
    expect(screen.getByText(/It's not a test/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Got it" }));
    expect(screen.queryByText(/It's not a test/)).toBeNull();
    cleanup();
    render(<Advisory />);
    expect(screen.queryByText(/It's not a test/)).toBeNull();
    await user.click(screen.getByRole("button", { name: "Not a diagnostic tool" }));
    expect(screen.getByText(/It's not a test/)).toBeTruthy();
  });
});

describe("MilestonesList follow-ups", () => {
  const proto = HTMLDialogElement.prototype;
  const original = { showModal: proto.showModal, close: proto.close };
  beforeEach(() => {
    vi.restoreAllMocks();
    setOnline(true);
    // jsdom has no <dialog> methods; the shared ConfirmDialog calls them.
    proto.showModal = function (this: HTMLDialogElement) { this.setAttribute("open", ""); };
    proto.close = function (this: HTMLDialogElement) { this.removeAttribute("open"); };
  });
  afterEach(() => {
    cleanup();
    proto.showModal = original.showModal;
    proto.close = original.close;
  });
  const typeNote = (user: ReturnType<typeof userEvent.setup>, text: string) => user.type(screen.getByLabelText(/Note \(optional\)/), text);
  const save = (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole("button", { name: "Save note" }));

  it("Discard note closes the form", async () => {
    const user = userEvent.setup();
    await ready();
    await openForm(user, /Note what you saw/);
    await typeNote(user, "x");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("heading", { name: "Discard this note?", hidden: true })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Discard note", hidden: true }));
    expect(screen.queryByLabelText(/Note \(optional\)/)).toBeNull();
  });

  it("Keep editing preserves the typed text", async () => {
    const user = userEvent.setup();
    await ready();
    await openForm(user, /Note what you saw/);
    await typeNote(user, "still here");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Keep editing", hidden: true }));
    expect((screen.getByLabelText(/Note \(optional\)/) as HTMLTextAreaElement).value).toBe("still here");
  });

  it("moves focus into the form, then back to the button on Cancel and on Save", async () => {
    const user = userEvent.setup();
    await ready();
    await openForm(user, /Note what you saw: Finds a hidden toy/);
    expect(document.activeElement).toBe(screen.getByLabelText("What did you see?"));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(document.activeElement).toBe(screen.getByRole("button", { name: /Note what you saw: Finds a hidden toy/ }));
    vi.spyOn(api, "recordObservation").mockImplementation(async (_c, id, input) => obs({ milestoneId: id, ...input }));
    await openForm(user, /Note what you saw: Finds a hidden toy/);
    await save(user);
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: /Edit note: Finds a hidden toy/ })));
  });

  it("keeps focus in row B's form when row A's form closes because Edit was clicked on B", async () => {
    const user = userEvent.setup();
    await ready();
    await openForm(user, /Note what you saw: Finds a hidden toy/);
    await user.click(screen.getByRole("button", { name: /Note what you saw: Stacks two blocks/ }));
    const form = screen.getByRole("form", { name: /Note what you saw for Maya/ });
    expect(screen.getAllByRole("form")).toHaveLength(1);
    expect(form.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).toBe(screen.getByLabelText("What did you see?"));
  });

  it("disables Cancel while a save is running", async () => {
    const user = userEvent.setup();
    await ready();
    let finish: (o: MilestoneObservation) => void = () => {};
    vi.spyOn(api, "recordObservation").mockReturnValue(new Promise((resolve) => (finish = resolve)));
    await openForm(user, /Note what you saw/);
    await save(user);
    expect((screen.getByRole("button", { name: "Cancel" }) as HTMLButtonElement).disabled).toBe(true);
    finish(obs());
    await waitFor(() => expect(screen.queryByRole("form")).toBeNull());
  });

  it("shows the saved note on the card, cut at a word when long", async () => {
    await ready([obs({ notes: "Under the blue cloth" }), obs({ id: "b", milestoneId: "fx-cog-12-23m-02", notes: "word ".repeat(60) })]);
    expect(screen.getByText("Your note: Under the blue cloth")).toBeTruthy();
    const long = screen.getByText(/^Your note: word word/);
    expect(long.textContent!.endsWith("…")).toBe(true);
    expect(long.textContent!.length).toBeLessThan(140);
    expect(screen.getAllByText("Look for").length).toBe(8);
  });

  it("blocks a note over 500 characters with an inline error and sends nothing", async () => {
    const user = userEvent.setup();
    await ready();
    const record = vi.spyOn(api, "recordObservation");
    await openForm(user, /Note what you saw/);
    const field = screen.getByLabelText(/Note \(optional\)/);
    fireEvent.change(field, { target: { value: "a".repeat(501) } });
    await save(user);
    expect(screen.getByText("Notes can be up to 500 characters.")).toBeTruthy();
    expect(field.getAttribute("aria-invalid")).toBe("true");
    expect(record).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
  });

  it("asks the caregiver to sign in again when saving returns 401, with no Retry", async () => {
    const user = userEvent.setup();
    await ready();
    vi.spyOn(api, "recordObservation").mockRejectedValue(new UnauthorizedError());
    await openForm(user, /Note what you saw/);
    await typeNote(user, "kept");
    await save(user);
    expect(await screen.findByText("Please sign in again to continue")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
    expect((screen.getByLabelText(/Note \(optional\)/) as HTMLTextAreaElement).value).toBe("kept");
  });

  it("asks to sign in again when the list returns 401", async () => {
    vi.spyOn(api, "listObservations").mockRejectedValue(new UnauthorizedError());
    render(<MilestonesList child={child} />);
    expect(await screen.findByText("Please sign in again to continue")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
  });

  it("explains a future date on the date field after a 422, with no Retry", async () => {
    const user = userEvent.setup();
    await ready();
    vi.spyOn(api, "recordObservation").mockRejectedValue(new ApiError(422, "UNPROCESSABLE_ENTITY", "future"));
    await openForm(user, /Note what you saw/);
    await save(user);
    expect(await screen.findByText(/still ahead of today's date\. The latest date you can pick is [A-Z][a-z]{2} \d{1,2}, \d{4}\./)).toBeTruthy();
    expect(screen.getByLabelText(/^Date/).getAttribute("aria-invalid")).toBe("true");
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
  });

  it.each([400, 404, 413])("shows a specific message and no Retry for a %i response", async (status) => {
    const user = userEvent.setup();
    await ready();
    vi.spyOn(api, "recordObservation").mockRejectedValue(new ApiError(status, "X", "detail"));
    await openForm(user, /Note what you saw/);
    await save(user);
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("We couldn't save this note");
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
  });

  it("sends once when Save is double-clicked", async () => {
    const user = userEvent.setup();
    await ready();
    let finish: (o: MilestoneObservation) => void = () => {};
    const record = vi.spyOn(api, "recordObservation").mockReturnValue(new Promise((resolve) => (finish = resolve)));
    await openForm(user, /Note what you saw/);
    await user.dblClick(screen.getByRole("button", { name: "Save note" }));
    expect(record).toHaveBeenCalledTimes(1);
    finish(obs());
  });

  it("loads the other child's notes and drops an open form when the child changes", async () => {
    const user = userEvent.setup();
    const list = vi.spyOn(api, "listObservations").mockResolvedValue([]);
    const { rerender } = render(<MilestonesList key={child.id} child={child} />);
    await screen.findByRole("heading", { name: "Thinking" });
    await openForm(user, /Note what you saw/);
    const other = { ...child, id: "7a2d455f-95b9-4f35-8e83-85840b9d2473", nickname: "Leo" };
    rerender(<MilestonesList key={other.id} child={other} />);
    await screen.findByRole("heading", { name: "Thinking" });
    expect(list).toHaveBeenLastCalledWith(other.id);
    expect(screen.queryByLabelText(/Note \(optional\)/)).toBeNull();
  });

  it("tells the caregiver when the list may be cut off at 100 notes", async () => {
    const many = Array.from({ length: 100 }, (_, i) => obs({ id: `id-${i}`, milestoneId: `other-${i}` }));
    await ready(many);
    expect(screen.getByText("Some older notes may not show here")).toBeTruthy();
  });

  it("shows no cut-off notice under 100 notes", async () => {
    await ready([obs()]);
    expect(screen.queryByText("Some older notes may not show here")).toBeNull();
  });

  it("filters prompts by developmental domain chips", async () => {
    const user = userEvent.setup();
    await ready();

    expect(screen.getByRole("heading", { name: "Thinking" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Moving" })).toBeTruthy();

    // Click "Thinking" filter chip
    const thinkingChip = screen.getByRole("button", { name: "Thinking" });
    await user.click(thinkingChip);

    expect(screen.getByRole("heading", { name: "Thinking" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Moving" })).toBeNull();

    // Click "All" chip
    const allChip = screen.getByRole("button", { name: "All" });
    await user.click(allChip);

    expect(screen.getByRole("heading", { name: "Thinking" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Moving" })).toBeTruthy();
  });

  it("renders desktop guidance panel and calm reassurance note", async () => {
    await ready();

    expect(screen.getByRole("heading", { name: "Notice, don't score" })).toBeTruthy();
    expect(screen.getByText("This saves one moment from one day. It isn't a test.")).toBeTruthy();
  });
});
