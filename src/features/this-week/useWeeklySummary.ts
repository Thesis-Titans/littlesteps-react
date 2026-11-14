import { useCallback, useEffect, useState } from "react";
import { failureKind } from "../../services/offline";
import { getWeeklySummary } from "./api";
import type { WeeklySummary, WeeklySummaryQuery } from "./types";

export interface WeeklySummaryState {
  status: "loading" | "ready" | "error" | "offline" | "unauthorized";
  summary: WeeklySummary | null;
  reload: () => void;
}

export function useWeeklySummary(childId: string, query?: WeeklySummaryQuery): WeeklySummaryState {
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [status, setStatus] = useState<WeeklySummaryState["status"]>("loading");
  const [attempt, setAttempt] = useState(0);

  const queryWeek = query?.week;
  const queryStartDate = query?.startDate;

  useEffect(() => {
    let current = true;
    setStatus("loading");
    getWeeklySummary(
      childId,
      queryWeek ? { week: queryWeek } : queryStartDate ? { startDate: queryStartDate } : undefined
    ).then(
      (data) => {
        if (!current) return;
        setSummary(data);
        setStatus("ready");
      },
      (error: unknown) => {
        if (current) setStatus(failureKind(error, navigator.onLine));
      }
    );
    return () => {
      current = false;
    };
  }, [childId, queryWeek, queryStartDate, attempt]);

  const reload = useCallback(() => {
    setStatus("loading");
    setAttempt((n) => n + 1);
  }, []);

  return { status, summary, reload };
}
