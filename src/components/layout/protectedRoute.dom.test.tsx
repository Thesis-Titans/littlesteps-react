// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes, useOutletContext } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProtectedRoute, type ShellContext } from "./ProtectedRoute";
import { checkSession } from "./sessionCheck";

vi.mock("./sessionCheck", () => ({ checkSession: vi.fn() }));
// Stable identities: the real context keeps them stable, and the check re-runs when they change.
const auth = vi.hoisted(() => ({ user: { uid: "u1" }, loading: false, signOut: () => Promise.resolve() }));
vi.mock("../../features/auth", () => ({
  useAuth: () => auth,
  SignInForm: () => <p>sign in</p>
}));
vi.mock("../../features/children", () => ({ ChildProvider: ({ children }: { children: ReactNode }) => children }));

function Shell() {
  const { sessionProblem } = useOutletContext<ShellContext>();
  return <p>problem: {sessionProblem ?? "none"}</p>;
}

beforeEach(() => vi.mocked(checkSession).mockReset());
afterEach(cleanup);

describe("ProtectedRoute", () => {
  it("re-runs the account check when the browser comes back online", async () => {
    vi.mocked(checkSession).mockResolvedValueOnce({ problem: "offline" }).mockResolvedValue({});
    render(
      <MemoryRouter>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="*" element={<Shell />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(await screen.findByText("problem: offline")).toBeTruthy();
    expect(checkSession).toHaveBeenCalledTimes(1);

    await act(async () => { window.dispatchEvent(new Event("online")); });

    expect(checkSession).toHaveBeenCalledTimes(2);
    expect(await screen.findByText("problem: none")).toBeTruthy();
  });
});
