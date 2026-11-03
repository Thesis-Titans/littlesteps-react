import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Chip,
  EmptyState,
  InlineAlert,
  Select,
  Skeleton,
  TextField,
} from "../../../components/common";
import { AGE_BANDS, ageBandLabel, type AgeBand } from "../../children/types";
import { fetchCatalogActivities, filterFallbackActivities } from "../api";
import { DOMAIN_LABELS, DOMAINS, type CatalogActivity, type Domain } from "../types";
import { ActivityCard } from "./ActivityCard";
import { ActivityDetailModal } from "./ActivityDetailModal";

type CatalogBrowserProps = {
  initialAgeBand?: AgeBand;
  activeChildNickname?: string;
  /** Called with the activity when the caregiver chooses "Add to plan" in the detail view. */
  onPlan?: (activity: CatalogActivity) => void;
};

export function CatalogBrowser({ initialAgeBand, activeChildNickname, onPlan }: CatalogBrowserProps) {
  const [selectedAgeBand, setSelectedAgeBand] = useState<AgeBand | "all">(
    initialAgeBand ?? "all"
  );
  const [prevInitialBand, setPrevInitialBand] = useState(initialAgeBand);
  const [selectedDomain, setSelectedDomain] = useState<Domain | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activities, setActivities] = useState<CatalogActivity[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [usingFallback, setUsingFallback] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<CatalogActivity | null>(null);
  const [reloads, setReloads] = useState(0);

  // Sync prop changes during render without an effect (React 19 pattern)
  if (initialAgeBand !== prevInitialBand) {
    setPrevInitialBand(initialAgeBand);
    if (initialAgeBand) {
      setSelectedAgeBand(initialAgeBand);
    }
  }

  useEffect(() => {
    let live = true;

    fetchCatalogActivities({
      ageBand: selectedAgeBand !== "all" ? selectedAgeBand : undefined,
      domain: selectedDomain !== "all" ? selectedDomain : undefined,
    }).then(
      (result) => {
        if (!live) return;
        if (result.items && result.items.length > 0) {
          setActivities(result.items);
          setUsingFallback(false);
          setStatus("ready");
        } else {
          // When server has no items yet (e.g. reviewed content pending), use reviewed fallback data
          const fallback = filterFallbackActivities({
            ageBand: selectedAgeBand !== "all" ? selectedAgeBand : undefined,
            domain: selectedDomain !== "all" ? selectedDomain : undefined,
          });
          setActivities(fallback.items);
          setUsingFallback(true);
          setStatus("ready");
        }
      },
      () => {
        if (!live) return;
        // In case of network failure or server error, provide deterministic catalog fallback
        const fallback = filterFallbackActivities({
          ageBand: selectedAgeBand !== "all" ? selectedAgeBand : undefined,
          domain: selectedDomain !== "all" ? selectedDomain : undefined,
        });
        if (fallback.items.length > 0) {
          setActivities(fallback.items);
          setUsingFallback(true);
          setStatus("ready");
        } else {
          setStatus("error");
        }
      }
    );

    return () => {
      live = false;
    };
  }, [selectedAgeBand, selectedDomain, reloads]);

  const handleRetry = () => {
    setStatus("loading");
    setReloads((n) => n + 1);
  };

  const handleAgeChange = (band: AgeBand | "all") => {
    setStatus("loading");
    setSelectedAgeBand(band);
  };

  const handleDomainChange = (domain: Domain | "all") => {
    setStatus("loading");
    setSelectedDomain(domain);
  };

  const filteredActivities = useMemo(() => {
    let result = activities;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (act) =>
          act.title.toLowerCase().includes(q) ||
          act.materials.some((mat) => mat.toLowerCase().includes(q))
      );
    }

    return result;
  }, [activities, searchQuery]);

  const clearFilters = () => {
    setSearchQuery("");
    if (selectedAgeBand !== "all" || selectedDomain !== "all") {
      setStatus("loading");
      setSelectedAgeBand("all");
      setSelectedDomain("all");
    }
  };

  const ageOptions = useMemo(() => {
    return [
      { value: "all", label: "All ages" },
      ...AGE_BANDS.map((band) => ({
        value: band,
        label: ageBandLabel(band),
      })),
    ];
  }, []);

  return (
    <section className="catalog-browser" aria-label="Learning library">
      <div className="catalog-header-row">
        <div>
          <h2 className="catalog-title">Learning activities</h2>
          <p className="catalog-subtitle">
            Explore everyday play ideas from our reviewed early learning list.
          </p>
        </div>
      </div>

      {usingFallback && (
        <InlineAlert
          kind="info"
          title="Showing saved activities"
        >
          <p>You are viewing our curated activity list.</p>
        </InlineAlert>
      )}

      {/* Filters */}
      <div className="catalog-controls">
        <div className="catalog-search-row">
          <TextField
            label="Search activities"
            type="search"
            placeholder="Search by title or materials (e.g. cups, mirror)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="catalog-filter-group">
          <Select
            label="Child's age"
            value={selectedAgeBand}
            onChange={(e) => handleAgeChange(e.target.value as AgeBand | "all")}
            options={ageOptions}
          />
        </div>

        {initialAgeBand && activeChildNickname && selectedAgeBand !== initialAgeBand && (
          <div className="catalog-quick-filter">
            <Button
              variant="text"
              onClick={() => handleAgeChange(initialAgeBand)}
            >
              Show ideas for {activeChildNickname}'s age ({ageBandLabel(initialAgeBand)})
            </Button>
          </div>
        )}

        <div className="catalog-domains-row" role="group" aria-label="Kind of play">
          <span className="catalog-filter-label" id="domain-filter-label">Kind of play:</span>
          <div className="catalog-domain-chips" aria-labelledby="domain-filter-label">
            <Chip
              selected={selectedDomain === "all"}
              onClick={() => handleDomainChange("all")}
            >
              All
            </Chip>
            {DOMAINS.map((domain) => (
              <Chip
                key={domain}
                selected={selectedDomain === domain}
                onClick={() => handleDomainChange(domain)}
              >
                {DOMAIN_LABELS[domain]}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      {/* States */}
      {status === "loading" && (
        <div className="catalog-grid" aria-busy="true" aria-label="Loading activities">
          <Skeleton kind="card" label="Loading activities" />
          <Skeleton kind="card" label="Loading activities" />
          <Skeleton kind="card" label="Loading activities" />
        </div>
      )}

      {status === "error" && (
        <InlineAlert
          kind="error"
          title="The activity list didn't load"
          action={
            <Button variant="secondary" onClick={handleRetry}>
              Retry
            </Button>
          }
        >
          <p>Check your connection, then choose Retry.</p>
        </InlineAlert>
      )}

      {status === "ready" && filteredActivities.length === 0 && (
        <EmptyState
          title="No activities match these filters"
          action={
            <Button variant="secondary" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        >
          <p>Try clearing 'Materials' or choosing another kind of play.</p>
        </EmptyState>
      )}

      {status === "ready" && filteredActivities.length > 0 && (
        <div className="catalog-grid">
          {filteredActivities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onSelect={setSelectedActivity}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <ActivityDetailModal
        activity={selectedActivity}
        onClose={() => setSelectedActivity(null)}
        onPlan={onPlan && ((activity) => { setSelectedActivity(null); onPlan(activity); })}
      />
    </section>
  );
}
