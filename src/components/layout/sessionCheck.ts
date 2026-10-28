import { getCurrentUser, UnauthorizedError } from "../../services/api";

export type SessionProblem = "offline" | "error";
export type SessionCheck = { notice?: string; problem?: SessionProblem };

/** Confirms the API accepts this session; a rejected token signs the caregiver out with a notice. */
export async function checkSession(signOut: () => Promise<void>): Promise<SessionCheck> {
  try {
    await getCurrentUser();
    return {};
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      void signOut();
      return { notice: error.message };
    }
    // fetch rejects with a TypeError when the network is down
    const offline = navigator.onLine === false || error instanceof TypeError;
    return { problem: offline ? "offline" : "error" };
  }
}
