import { useCallback, useEffect, useState } from "react";
import { fetchCatalogActivities, FALLBACK_CATALOG_ACTIVITIES, type CatalogActivity } from "../../catalog";
import { failureKind } from "../../../services/offline";
import { listPlans, updatePlan } from "../api";
import { byCompletedDesc, problemFor, type Problem } from "../logic";
import type { Plan } from "../types";

/** The API lists at most this many plans, oldest first. */
export const HISTORY_LIMIT = 100;

type Loaded = { plans: Plan[]; history: Plan[]; historyCut: boolean; activities: Record<string, CatalogActivity> };
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
  const [busyIds, setBusyIds] = useState<string[]>([]);
  /** Counts finished changes, so the screen can move focus once the button that was pressed is gone. */
  const [settled, setSettled] = useState<{ n: number; planId: string }>({ n: 0, planId: "" });
  const [problem, setProblem] = useState<Problem & { retry?: () => void }>();
  const [toast, setToast] = useState<Plan>();

  useEffect(() => {
    let live = true;
    Promise.all([listPlans(childId, { date: today }), listPlans(childId, { status: "completed" }), loadActivities()]).then(
      ([plans, history, activities]) => {
        // The API returns the oldest completed plans first, so a full page means newer ones may be missing (the screen says so).
        if (live) setLoad({ status: "ready", plans: plans.filter((p) => p.status !== "skipped"), history: history.sort(byCompletedDesc), historyCut: history.length >= HISTORY_LIMIT, activities });
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
    const what = status === "completed" ? "marked complete" : "changed back to planned";
    setBusyIds((ids) => [...ids, plan.id]);
    setProblem(undefined);
    try {
      const next = await updatePlan(childId, plan.id, { status });
      apply(next);
      // A new toast replaces the old one; a successful undo removes it. A failed undo keeps it so Undo can be pressed again.
      setToast((t) => (status === "completed" ? next : t?.id === plan.id ? undefined : t));
    } catch (error) {
      const found = problemFor(error, what);
      if (found.kind === "gone") {
        setLoad((s) => (s.status === "ready" ? { ...s, plans: s.plans.filter((p) => p.id !== plan.id) } : s));
        setToast((t) => (t?.id === plan.id ? undefined : t));
      }
      setProblem({ ...found, retry: found.kind === "gone" || found.kind === "unauthorized" ? undefined : () => void change(plan, status) });
    } finally {
      setBusyIds((ids) => ids.filter((id) => id !== plan.id));
      setSettled((s) => ({ n: s.n + 1, planId: plan.id }));
    }
  };

  return {
    load,
    reload,
    busyIds,
    settled,
    problem,
    toast,
    markComplete: (plan: Plan) => change(plan, "completed"),
    undo: () => {
      if (toast && !busyIds.includes(toast.id)) void change(toast, "planned");
    },
    closeToast: useCallback(() => setToast(undefined), [])
  };
}
