import { useCallback, useEffect, useState } from "react";
import { failureKind } from "../../services/offline";
import { listObservations } from "./api";
import type { MilestoneObservation } from "./types";

export type ObservationsState = {
  status: "loading" | "ready" | "error" | "offline" | "unauthorized";
  observations: MilestoneObservation[];
  reload: () => void;
  /** Adds or replaces a saved record without another request. */
  put: (observation: MilestoneObservation) => void;
};

export function useObservations(childId: string): ObservationsState {
  const [observations, setObservations] = useState<MilestoneObservation[]>([]);
  const [status, setStatus] = useState<ObservationsState["status"]>("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    listObservations(childId).then(
      (list) => {
        if (!current) return;
        setObservations(list);
        setStatus("ready");
      },
      (error: unknown) => {
        if (current) setStatus(failureKind(error, navigator.onLine));
      }
    );
    return () => {
      current = false;
    };
  }, [childId, attempt]);

  const reload = useCallback(() => {
    setStatus("loading");
    setAttempt((n) => n + 1);
  }, []);
  const put = useCallback(
    (o: MilestoneObservation) => setObservations((list) => [...list.filter((x) => x.id !== o.id), o]),
    []
  );
  return { status, observations, reload, put };
}
