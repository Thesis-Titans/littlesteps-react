import { ApiError, apiFetch } from "../../services/api";
import type { CreatePlanInput, Plan, PlanStatus, UpdatePlanInput } from "./types";

const plansPath = (childId: string) => `/api/v1/children/${encodeURIComponent(childId)}/plans`;
const STATUSES: readonly unknown[] = ["planned", "completed", "skipped"];

const isPlan = (value: unknown): value is Plan => {
  const p = value as Partial<Plan> | null;
  return typeof p === "object" && p !== null && typeof p.id === "string" && typeof p.activityId === "string" &&
    typeof p.scheduledDate === "string" && STATUSES.includes(p.status);
};

async function readPlans(response: Response): Promise<Plan[]> {
  const data: unknown = await response.json();
  const items = Array.isArray(data) ? data : [data];
  if (!items.every(isPlan)) throw new ApiError(response.status, "INVALID_RESPONSE", "Unexpected response from the server");
  return items;
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body)
});

export async function listPlans(childId: string, query: { date?: string; status?: PlanStatus } = {}): Promise<Plan[]> {
  const params = new URLSearchParams();
  if (query.date) params.set("date", query.date);
  if (query.status) params.set("status", query.status);
  const qs = params.toString();
  return readPlans(await apiFetch(`${plansPath(childId)}${qs ? `?${qs}` : ""}`));
}

export async function createPlan(childId: string, input: CreatePlanInput): Promise<Plan> {
  return (await readPlans(await apiFetch(plansPath(childId), json("POST", input))))[0];
}

export async function updatePlan(childId: string, planId: string, input: UpdatePlanInput): Promise<Plan> {
  return (await readPlans(await apiFetch(`${plansPath(childId)}/${encodeURIComponent(planId)}`, json("PATCH", input))))[0];
}
