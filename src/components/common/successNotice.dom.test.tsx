// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SuccessNotice } from "./SuccessNotice";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const page = (message: string | undefined, onClose: () => void) => (
  <>
    <h1 tabIndex={-1}>Your children</h1>
    <SuccessNotice message={message} onClose={onClose} />
  </>
);

describe("SuccessNotice interactions", () => {
  it("fills the status region that was already mounted", () => {
    const { rerender } = render(page(undefined, vi.fn()));
    const region = screen.getByRole("status");
    expect(region.textContent).toBe("");
    rerender(page("Maya added.", vi.fn()));
    expect(screen.getByRole("status")).toBe(region);
    expect(region.textContent).toContain("Maya added.");
  });

  it("dismiss calls onClose and moves focus to the page heading", () => {
    const onClose = vi.fn();
    render(page("Maya added.", onClose));
    fireEvent.click(screen.getByRole("button", { name: "Dismiss message" }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(screen.getByRole("heading", { level: 1 }));
  });

  it("closes itself after the minimum time", () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(page("Maya added.", onClose));
    act(() => { vi.advanceTimersByTime(9_999); });
    expect(onClose).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(1); });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("restarts the timer when the message changes", () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    const { rerender } = render(page("Maya added.", onClose));
    act(() => { vi.advanceTimersByTime(9_000); });
    rerender(page("Liam added.", onClose));
    act(() => { vi.advanceTimersByTime(9_000); });
    expect(onClose).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(1_000); });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("pauses while focused and resumes with the time left", () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(page("Maya added.", onClose));
    act(() => { vi.advanceTimersByTime(4_000); });
    const dismiss = screen.getByRole("button", { name: "Dismiss message" });
    fireEvent.focus(dismiss);
    act(() => { vi.advanceTimersByTime(60_000); });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.blur(dismiss);
    act(() => { vi.advanceTimersByTime(5_999); });
    expect(onClose).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(1); });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
