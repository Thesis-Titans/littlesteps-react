// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FirebaseError } from "firebase/app";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthContext } from "./context";
import { CreateAccountForm } from "./components/CreateAccountForm";
import type { AuthState } from "./types";

function setup(createAccount: AuthState["createAccount"] = vi.fn().mockResolvedValue(undefined)) {
  const value: AuthState = { user: null, loading: false, signIn: vi.fn(), signOut: vi.fn(), createAccount };
  render(
    <AuthContext.Provider value={value}>
      <MemoryRouter><CreateAccountForm /></MemoryRouter>
    </AuthContext.Provider>
  );
  return { createAccount, user: userEvent.setup() };
}

const email = () => screen.getByLabelText("Email");
const password = () => screen.getByLabelText("Password");
const privacy = () => screen.getByRole("checkbox", { name: /privacy summary/ });
const submit = () => screen.getByRole("button", { name: /create account|creating account/i });

afterEach(cleanup);

describe("CreateAccountForm", () => {
  it("shows the email error and focuses the email field", async () => {
    const { user } = setup();
    await user.type(email(), "nope");
    await user.type(password(), "longenough1");
    await user.click(privacy());
    await user.click(submit());
    expect(await screen.findByText(/like you@example.com/)).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(email()));
  });

  it("shows the weak password message", async () => {
    const { user, createAccount } = setup();
    await user.type(email(), "a@b.co");
    await user.type(password(), "short");
    await user.click(privacy());
    await user.click(submit());
    expect(await screen.findByText("Use at least 8 characters.")).toBeTruthy();
    expect(createAccount).not.toHaveBeenCalled();
  });

  it("blocks submit until the privacy box is checked", async () => {
    const { user, createAccount } = setup();
    await user.type(email(), "a@b.co");
    await user.type(password(), "longenough1");
    await user.click(submit());
    expect(await screen.findByText("Please confirm you have read the privacy summary.")).toBeTruthy();
    expect(createAccount).not.toHaveBeenCalled();
  });

  it("disables the button while pending and calls createAccount once", async () => {
    let finish!: () => void;
    const pending = vi.fn(() => new Promise<void>((resolve) => { finish = resolve; }));
    const { user } = setup(pending);
    await user.type(email(), "a@b.co");
    await user.type(password(), "longenough1");
    await user.click(privacy());
    await user.click(submit());
    await waitFor(() => expect((submit() as HTMLButtonElement).disabled).toBe(true));
    await user.click(submit());
    expect(pending).toHaveBeenCalledTimes(1);
    finish();
  });

  it("maps auth/email-already-in-use to the email field", async () => {
    const { user } = setup(vi.fn().mockRejectedValue(new FirebaseError("auth/email-already-in-use", "x")));
    await user.type(email(), "a@b.co");
    await user.type(password(), "longenough1");
    await user.click(privacy());
    await user.click(submit());
    expect(await screen.findByText(/can't be used for a new account/)).toBeTruthy();
  });

  it("keeps the toggle label fixed while aria-pressed flips", async () => {
    const { user } = setup();
    const toggle = screen.getByRole("button", { name: "Show password" });
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    await user.click(toggle);
    expect(screen.getByRole("button", { name: "Show password" }).getAttribute("aria-pressed")).toBe("true");
    expect(password().getAttribute("type")).toBe("text");
  });

  it("calls createAccount once with trimmed email and untouched password", async () => {
    const { user, createAccount } = setup();
    await user.type(email(), "  a@b.co  ");
    await user.type(password(), " pass word 1 ");
    await user.click(privacy());
    await user.click(submit());
    await waitFor(() => expect(createAccount).toHaveBeenCalledTimes(1));
    expect(createAccount).toHaveBeenCalledWith("a@b.co", " pass word 1 ");
  });
});
