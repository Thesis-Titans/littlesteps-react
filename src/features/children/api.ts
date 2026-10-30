import { ApiError, apiFetch } from "../../services/api";
import { isAgeBand } from "./types";
import type { Child, CreateChildInput, UpdateChildInput } from "./types";

async function send<T>(path: string, method: string, body?: unknown): Promise<T> {
  const response = await apiFetch(path, {
    method,
    ...(body === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  });
  const data: unknown = await response.json();
  const items = Array.isArray(data) ? data : [data];
  if (!items.every((c) => typeof c === "object" && c !== null && isAgeBand((c as { ageBand?: unknown }).ageBand))) {
    throw new ApiError(response.status, "INVALID_RESPONSE", "Unexpected response from the server");
  }
  return data as T;
}

const childPath = (childId: string) => `/api/v1/children/${encodeURIComponent(childId)}`;

export const listChildren = () => send<Child[]>("/api/v1/children", "GET");
export const createChild = (input: CreateChildInput) => send<Child>("/api/v1/children", "POST", input);
export const getChild = (childId: string) => send<Child>(childPath(childId), "GET");
export const updateChild = (childId: string, input: UpdateChildInput) =>
  send<Child>(childPath(childId), "PATCH", input);
