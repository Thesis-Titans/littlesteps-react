export interface SegmentedTabItem<T extends string> {
  id: T;
  label: string;
  count?: number;
}

export interface SegmentedTabsProps<T extends string> {
  ariaLabel: string;
  tabs: readonly SegmentedTabItem<T>[];
  activeId: T;
  onChange: (id: T) => void;
  className?: string;
}

/** Horizontal section switcher matching a scrollable pill tab bar with accessible tablist semantics. */
export function SegmentedTabs<T extends string>({
  ariaLabel,
  tabs,
  activeId,
  onChange,
  className = "",
}: SegmentedTabsProps<T>) {
  return (
    <div className={`ls-segmented-tabs ${className}`.trim()} role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        const accessibleName =
          typeof tab.count === "number" && tab.count > 0 ? `${tab.label} (${tab.count})` : tab.label;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={accessibleName}
            className="ls-segmented-tab"
            onClick={() => onChange(tab.id)}
          >
            <span>{tab.label}</span>
            {typeof tab.count === "number" && tab.count > 0 && (
              <span className="ls-tab-count" aria-hidden="true">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
