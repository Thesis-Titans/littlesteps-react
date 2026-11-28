// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { User } from "firebase/auth";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installDialogPolyfill } from "../../../test/dialogPolyfill";
import { AuthContext } from "../../auth/context";
import * as accountApi from "../api";
import { SettingsScreen } from "../components/SettingsScreen";

vi.mock("../../../services/firebase", () => ({ auth: {} }));

installDialogPolyfill();

const mockUser = { uid: "u1", email: "parent@example.com" } as User;

function renderSettings(signOut = vi.fn().mockResolvedValue(undefined)) {
  render(
    <AuthContext.Provider
      value={{
        user: mockUser,
        loading: false,
        signIn: vi.fn(),
        createAccount: vi.fn(),
        signOut,
      }}
    >
      <MemoryRouter>
        <SettingsScreen />
      </MemoryRouter>
    </AuthContext.Provider>
  );
  return { signOut, user: userEvent.setup() };
}

describe("SettingsScreen DOM", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(cleanup);

  it("wires Sign out button to useAuth.signOut", async () => {
    const { signOut, user } = renderSettings();
    await user.click(screen.getByRole("button", { name: "Sign out" }));
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it("downloads JSON account export via GET /api/v1/me/export", async () => {
    const exportSpy = vi.spyOn(accountApi, "exportAccountData").mockResolvedValue({
      exportedAt: "2026-11-28T00:00:00Z",
      children: [],
    });
    const createUrl = vi.fn(() => "blob:mock-export");
    const revokeUrl = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { value: createUrl, writable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: revokeUrl, writable: true });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    const { user } = renderSettings();
    await user.click(screen.getByRole("button", { name: "Download my data" }));

    await waitFor(() => {
      expect(exportSpy).toHaveBeenCalledTimes(1);
      expect(screen.getByText("Your LittleSteps data export has been downloaded.")).toBeTruthy();
    });
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeUrl).toHaveBeenCalledWith("blob:mock-export");
  });

  it("confirms and permanently deletes the account via DELETE /api/v1/me", async () => {
    const deleteSpy = vi.spyOn(accountApi, "deleteAccount").mockResolvedValue(undefined);
    const { signOut, user } = renderSettings();

    await user.click(screen.getByRole("button", { name: "Delete my account" }));
    expect(screen.getByRole("heading", { name: "Delete your account?" })).toBeTruthy();

    const confirmButtons = screen.getAllByRole("button", { name: "Delete my account" });
    await user.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledTimes(1);
      expect(signOut).toHaveBeenCalledTimes(1);
    });
  });
});
