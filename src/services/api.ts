import { auth } from "./firebase";

function getApiBaseUrl(): string | undefined {
  return (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "");
}

export type ApiHealth = { status: "ok" };
export type CurrentUser = { uid: string };

export class UnauthorizedError extends Error {
  constructor() {
    super("Your session has ended. Please sign in again.");
    this.name = "UnauthorizedError";
  }
}

export type ApiErrorDetail = { field: string; issue: string };

/** Non-OK API response (other than 401). `code` and `details` come from the error envelope when present. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | undefined,
    message: string,
    readonly details: ApiErrorDetail[] = []
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  const generic = `Something went wrong (HTTP ${response.status}).`;
  try {
    const body: unknown = await response.json();
    const error = (body as { error?: unknown } | null)?.error as
      | { code?: unknown; message?: unknown; details?: unknown }
      | null
      | undefined;
    if (typeof error !== "object" || error === null) return new ApiError(response.status, undefined, generic);
    const details = Array.isArray(error.details)
      ? error.details.filter(
          (d): d is ApiErrorDetail => typeof d?.field === "string" && typeof d?.issue === "string"
        )
      : [];
    return new ApiError(
      response.status,
      typeof error.code === "string" ? error.code : undefined,
      typeof error.message === "string" ? error.message : generic,
      details
    );
  } catch {
    return new ApiError(response.status, undefined, generic);
  }
}

export async function getApiHealth(): Promise<ApiHealth> {
  const apiBaseUrl = getApiBaseUrl();
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

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) throw new Error("Set VITE_API_BASE_URL in .env.local first.");

  const send = async (forceRefresh: boolean) => {
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    const token = await auth.currentUser?.getIdToken(forceRefresh);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return fetch(`${apiBaseUrl}${path}`, { ...init, headers, cache: "no-store" });
  };

  let response = await send(false);
  // A cached token can be revoked or clock-skewed; retry once with a fresh one before giving up.
  if (response.status === 401 && auth.currentUser) response = await send(true);
  if (response.status === 401) throw new UnauthorizedError();
  if (!response.ok) throw await toApiError(response);
  return response;
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const response = await apiFetch("/api/v1/me");
  const body: unknown = await response.json();
  if (typeof body !== "object" || body === null || !("uid" in body) || typeof body.uid !== "string") {
    throw new Error("API returned an unexpected account response.");
  }
  return { uid: body.uid };
}
