// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../services/api";
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
    expect(screen.getByText("Observed on Oct 21, 2026")).toBeTruthy();
    expect(screen.getAllByText("Not yet observed")).toHaveLength(7);
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
    expect(await screen.findByText("Observed on Oct 21, 2026")).toBeTruthy();
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
    await waitFor(() => expect(screen.queryByText("Observed on Oct 21, 2026")).toBeNull());
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

  it("asks before discarding typed text", async () => {
    const user = userEvent.setup();
    await ready();
    await openForm(user, /Note what you saw/);
    await user.type(screen.getByLabelText(/Note \(optional\)/), "x");
    // jsdom has no <dialog> methods; the shared ConfirmDialog calls showModal.
    const showModal = vi.fn();
    HTMLDialogElement.prototype.showModal = showModal;
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(showModal).toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Discard this note?", hidden: true })).toBeTruthy();
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
