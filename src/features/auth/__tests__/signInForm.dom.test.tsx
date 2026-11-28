// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FirebaseError } from "firebase/app";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { installDialogPolyfill } from "../../../test/dialogPolyfill";
import { AuthContext } from "../context";
import { SignInForm } from "../components/SignInForm";
import type { AuthState } from "../types";

installDialogPolyfill();

function setup(
  signIn: AuthState["signIn"] = vi.fn().mockResolvedValue(undefined),
  notice?: string,
  resetPassword: NonNullable<AuthState["resetPassword"]> = vi.fn().mockResolvedValue(undefined)
) {
  const value: AuthState = {
    user: null,
    loading: false,
    signIn,
    signOut: vi.fn(),
    createAccount: vi.fn(),
    resetPassword,
  };
  render(
    <AuthContext.Provider value={value}>
      <MemoryRouter>
        <SignInForm notice={notice} />
      </MemoryRouter>
    </AuthContext.Provider>
  );
  return { signIn, resetPassword, user: userEvent.setup() };
}

afterEach(cleanup);

describe("SignInForm", () => {
  it("renders the concise sign-in form without promotional subtitles or filler copy", () => {
    setup();

    // Cleaned-up heading
    expect(screen.getByRole("heading", { level: 1, name: "Sign in" })).toBeTruthy();

    // Promotional subtitles and fillers removed
    expect(screen.queryByText(/Enter your email and password/i)).toBeNull();
    expect(screen.queryByText(/Sign in to plan play, notice milestones/i)).toBeNull();
    expect(screen.queryByText(/New to LittleSteps\?/i)).toBeNull();
    expect(screen.queryByText(/You will read the privacy notice before creating an account/i)).toBeNull();

    // Updated brand bullets
    expect(screen.getByText("Plan play and note what you can.")).toBeTruthy();
    expect(screen.getByText("Your journal stays private.")).toBeTruthy();
    expect(screen.getByText("Every activity shows where it comes from.")).toBeTruthy();

    // Form inputs and links
    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.getByLabelText("Password")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Show password" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Forgot password?" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Create account" })).toBeTruthy();
  });

  it("toggles password visibility with accessible button and aria-pressed state", async () => {
    const { user } = setup();
    const passwordInput = screen.getByLabelText("Password");
    const toggleButton = screen.getByRole("button", { name: "Show password" });

    expect(passwordInput.getAttribute("type")).toBe("password");
    expect(toggleButton.getAttribute("aria-pressed")).toBe("false");

    await user.click(toggleButton);

    expect(passwordInput.getAttribute("type")).toBe("text");
    expect(toggleButton.getAttribute("aria-pressed")).toBe("true");

    await user.click(toggleButton);

    expect(passwordInput.getAttribute("type")).toBe("password");
    expect(toggleButton.getAttribute("aria-pressed")).toBe("false");
  });

  it("calls signIn with trimmed email and password upon submission", async () => {
    const { user, signIn } = setup();

    await user.type(screen.getByLabelText("Email"), " caregiver@example.com ");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(signIn).toHaveBeenCalledTimes(1);
    expect(signIn).toHaveBeenCalledWith("caregiver@example.com", "secret123");
  });

  it("displays error message on invalid credentials", async () => {
    const failingSignIn = vi.fn().mockRejectedValue(new FirebaseError("auth/invalid-credential", "Invalid credential"));
    const { user } = setup(failingSignIn);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "wrongpass");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(
        screen.getByText("That email and password don't match an account. Please check them and try again.")
      ).toBeTruthy();
    });
  });

  it("displays notice when passed in props", () => {
    setup(vi.fn(), "Your session expired. Please sign in again.");
    expect(screen.getByText("Your session expired. Please sign in again.")).toBeTruthy();
  });

  it("opens an inline password reset modal and sends a reset link", async () => {
    const resetPassword = vi.fn().mockResolvedValue(undefined);
    const { user } = setup(vi.fn(), undefined, resetPassword);

    await user.type(screen.getByLabelText("Email"), "caregiver@example.com");
    await user.click(screen.getByRole("button", { name: "Forgot password?" }));

    expect(screen.getByRole("heading", { name: "Reset your password" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() => {
      expect(resetPassword).toHaveBeenCalledWith("caregiver@example.com");
      expect(screen.getByText(/password reset link has been sent/i)).toBeTruthy();
    });
  });
});
