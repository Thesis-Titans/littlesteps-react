import { getCurrentUser, UnauthorizedError } from "../../services/api";
import { failureKind } from "../../services/offline";

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
    return { problem: failureKind(error, navigator.onLine !== false) === "offline" ? "offline" : "error" };
  }
}
