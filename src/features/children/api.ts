import { apiFetch } from "../../services/api";
import type { Child, CreateChildInput, UpdateChildInput } from "./types";

async function send<T>(path: string, method: string, body?: unknown): Promise<T> {
  const response = await apiFetch(path, {
    method,
    ...(body === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  });
  return (await response.json()) as T;
}

const childPath = (childId: string) => `/api/v1/children/${encodeURIComponent(childId)}`;

export const listChildren = () => send<Child[]>("/api/v1/children", "GET");
export const createChild = (input: CreateChildInput) => send<Child>("/api/v1/children", "POST", input);
export const getChild = (childId: string) => send<Child>(childPath(childId), "GET");
export const updateChild = (childId: string, input: UpdateChildInput) =>
  send<Child>(childPath(childId), "PATCH", input);
