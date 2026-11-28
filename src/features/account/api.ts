import { apiFetch } from "../../services/api";

/**
 * Downloads the signed-in caregiver's complete LittleSteps account export (`GET /api/v1/me/export`).
 */
export async function exportAccountData(): Promise<Record<string, unknown>> {
  const response = await apiFetch("/api/v1/me/export");
  return (await response.json()) as Record<string, unknown>;
}

/**
 * Permanently deletes the signed-in caregiver's account and all child records (`DELETE /api/v1/me`).
 */
export async function deleteAccount(): Promise<void> {
  await apiFetch("/api/v1/me", { method: "DELETE" });
}
