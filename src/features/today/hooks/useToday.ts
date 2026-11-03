import { useCallback, useEffect, useState } from "react";
import { fetchCatalogActivities, FALLBACK_CATALOG_ACTIVITIES, type CatalogActivity } from "../../catalog";
import { failureKind } from "../../../services/offline";
import { listPlans, updatePlan } from "../api";
import { byCompletedDesc, problemFor, type Problem } from "../logic";
import type { Plan } from "../types";

type Loaded = { plans: Plan[]; history: Plan[]; activities: Record<string, CatalogActivity> };
type Load = { status: "loading" } | { status: "error" | "offline" | "unauthorized" } | ({ status: "ready" } & Loaded);

/** The catalog is the source of titles; saved copies fill in when it can't be reached. */
async function loadActivities(): Promise<Record<string, CatalogActivity>> {
  const map = Object.fromEntries(FALLBACK_CATALOG_ACTIVITIES.map((a) => [a.id, a]));
  try {
    for (const a of (await fetchCatalogActivities()).items ?? []) map[a.id] = a;
  } catch {
    /* keep the saved copies */
  }
  return map;
}

const online = () => typeof navigator === "undefined" || navigator.onLine !== false;

/** Today's plan, completed history, and mark complete / undo for one child. Key the caller by child id. */
export function useToday(childId: string, today: string) {
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [reloads, setReloads] = useState(0);
  const [busyId, setBusyId] = useState<string>();
  const [problem, setProblem] = useState<Problem & { retry?: () => void }>();
  const [toast, setToast] = useState<Plan>();

  useEffect(() => {
    let live = true;
    Promise.all([listPlans(childId, { date: today }), listPlans(childId, { status: "completed" }), loadActivities()]).then(
      ([plans, history, activities]) => {
        // shortcut: the API returns the oldest 100 first, so very long histories are cut; add paging with the journal.
        if (live) setLoad({ status: "ready", plans: plans.filter((p) => p.status !== "skipped"), history: history.sort(byCompletedDesc), activities });
      },
      (error) => live && setLoad({ status: failureKind(error, online()) })
    );
    return () => {
      live = false;
    };
  }, [childId, today, reloads]);

  const reload = useCallback(() => {
    setLoad({ status: "loading" });
    setReloads((n) => n + 1);
  }, []);

  const apply = (next: Plan) =>
    setLoad((s) =>
      s.status !== "ready" ? s : {
        ...s,
        plans: s.plans.map((p) => (p.id === next.id ? next : p)),
        history: (next.status === "completed" ? [next, ...s.history.filter((p) => p.id !== next.id)] : s.history.filter((p) => p.id !== next.id)).sort(byCompletedDesc)
      }
    );

  const change = async (plan: Plan, status: "completed" | "planned") => {
    const what = status === "completed" ? "marked complete" : "changed back";
    setBusyId(plan.id);
    setProblem(undefined);
    setToast(undefined); // the next action replaces the toast
    try {
      const next = await updatePlan(childId, plan.id, { status });
      apply(next);
      if (status === "completed") setToast(next);
    } catch (error) {
      const found = problemFor(error, what);
      if (found.kind === "gone") setLoad((s) => (s.status === "ready" ? { ...s, plans: s.plans.filter((p) => p.id !== plan.id) } : s));
      setProblem({ ...found, retry: found.kind === "gone" || found.kind === "unauthorized" ? undefined : () => void change(plan, status) });
    } finally {
      setBusyId(undefined);
    }
  };

  return {
    load,
    reload,
    busyId,
    problem,
    toast,
    markComplete: (plan: Plan) => change(plan, "completed"),
    undo: () => toast && change(toast, "planned"),
    closeToast: useCallback(() => setToast(undefined), [])
  };
}
