// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { installDialogPolyfill } from "../../../test/dialogPolyfill";
import { ModalDialog, PasswordField, SessionExpiredAlert } from "../index";

installDialogPolyfill();

afterEach(cleanup);

describe("Shared DRY common primitives", () => {
  it("PasswordField toggles between password and visible text", async () => {
    const user = userEvent.setup();
    render(<PasswordField id="pw" label="Password" name="password" />);

    const input = screen.getByLabelText("Password");
    const toggle = screen.getByRole("button", { name: "Show password" });

    expect(input.getAttribute("type")).toBe("password");
    expect(toggle.getAttribute("aria-pressed")).toBe("false");

    await user.click(toggle);
    expect(input.getAttribute("type")).toBe("text");
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
  });

  it("SessionExpiredAlert renders default and custom session messages", () => {
    const { rerender } = render(<SessionExpiredAlert />);
    expect(screen.getByRole("alert").textContent).toContain("Please sign in again to continue");
    expect(screen.getByRole("alert").textContent).toContain("Your saved notes are safe.");

    rerender(<SessionExpiredAlert message="Your session has ended. What you typed is still here." />);
    expect(screen.getByRole("alert").textContent).toContain("What you typed is still here.");
  });

  it("ModalDialog opens with showModal and calls onClose on cancel", () => {
    const onClose = vi.fn();
    render(
      <ModalDialog open labelledBy="dlg-title" onClose={onClose}>
        <h2 id="dlg-title">Dialog heading</h2>
        <p>Body copy</p>
      </ModalDialog>
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog.hasAttribute("open")).toBe(true);
    expect(dialog.getAttribute("aria-labelledby")).toBe("dlg-title");

    const cancelEvent = new Event("cancel", { cancelable: true });
    dialog.dispatchEvent(cancelEvent);
    expect(cancelEvent.defaultPrevented).toBe(true);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
