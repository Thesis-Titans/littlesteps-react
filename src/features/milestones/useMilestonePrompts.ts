import { useEffect, useState } from "react";
import { fetchCatalogMilestones } from "../catalog/api";
import type { AgeBand } from "../children/types";
import { promptsFor } from "./prompts";
import type { MilestonePrompt } from "./types";

/**
 * Loads milestone prompts for `ageBand` from the catalog API, falling back seamlessly
 * to the bundled multi-age-band reference prompts when offline or when no remote items exist.
 */
export function useMilestonePrompts(ageBand: AgeBand): MilestonePrompt[] {
  const [remote, setRemote] = useState<{ ageBand: AgeBand; prompts: MilestonePrompt[] } | null>(null);

  useEffect(() => {
    let active = true;
    fetchCatalogMilestones(ageBand)
      .then((res) => {
        if (!active || !res.items || res.items.length === 0) return;
        const mapped: MilestonePrompt[] = res.items.map((item) => ({
          id: item.id,
          domain: item.domain,
          ageBand,
          title: item.title,
          indicators: item.lookFor,
          provenanceSource: item.provenance,
          reviewStatus: item.status === "draft" ? "source_checked" : item.status,
        }));
        setRemote({ ageBand, prompts: mapped });
      })
      .catch(() => {
        // Keep bundled age-band prompts when offline or when the catalog endpoint is unavailable.
      });

    return () => {
      active = false;
    };
  }, [ageBand]);

  if (remote && remote.ageBand === ageBand && remote.prompts.length > 0) {
    return remote.prompts;
  }
  return promptsFor(ageBand);
}
