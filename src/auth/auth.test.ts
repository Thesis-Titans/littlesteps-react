import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AuthProvider } from "./AuthContext";
import { AuthContext, useAuth } from "./useAuth";
import type { AuthState } from "./types";

const firebaseAuth = vi.hoisted(() => ({
  signInWithEmailAndPassword: vi.fn().mockResolvedValue({}),
  signOut: vi.fn().mockResolvedValue(undefined),
  onIdTokenChanged: vi.fn(() => () => {})
}));
vi.mock("firebase/auth", () => firebaseAuth);
vi.mock("../firebase", () => ({ auth: { name: "test-auth" } }));

function capture(wrap: (child: ReturnType<typeof createElement>) => ReturnType<typeof createElement>) {
  let state: AuthState | undefined;
  function Probe() {
    state = useAuth();
    return null;
  }
  renderToString(wrap(createElement(Probe)));
  return state!;
}

describe("useAuth", () => {
  it("throws when used outside AuthProvider", () => {
    expect(() => capture((child) => child)).toThrow("useAuth must be used inside <AuthProvider>.");
  });

  it("starts in a loading, signed-out state", () => {
    const state = capture((child) => createElement(AuthProvider, null, child));
    expect(state.loading).toBe(true);
    expect(state.user).toBeNull();
  });

  it("delegates signIn and signOut to Firebase Auth", async () => {
    const state = capture((child) => createElement(AuthProvider, null, child));
    await state.signIn("caregiver@example.com", "secret");
    expect(firebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(
      { name: "test-auth" },
      "caregiver@example.com",
      "secret"
    );
    await state.signOut();
    expect(firebaseAuth.signOut).toHaveBeenCalledWith({ name: "test-auth" });
  });

  it("exposes the value provided by AuthContext", () => {
    const value = { user: null, loading: false, signIn: vi.fn(), signOut: vi.fn() } as AuthState;
    expect(capture((child) => createElement(AuthContext.Provider, { value }, child))).toBe(value);
  });
});
