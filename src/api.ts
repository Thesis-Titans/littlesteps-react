const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "");

export type ApiHealth = { status: "ok" };

export async function getApiHealth(): Promise<ApiHealth> {
  if (!apiBaseUrl) throw new Error("Set VITE_API_BASE_URL in .env.local first.");
  const response = await fetch(`${apiBaseUrl}/health`, {
    headers: { Accept: "application/json" },
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`API health check failed (HTTP ${response.status}).`);
  const body: unknown = await response.json();
  if (
    typeof body !== "object" ||
    body === null ||
    !("status" in body) ||
    body.status !== "ok"
  ) {
    throw new Error("API returned an unexpected health response.");
  }
  return { status: "ok" };
}
