import { Chip } from "./Chip";

export interface FilterChipOption<T extends string> {
  id: T;
  label: string;
  chipAriaLabel?: string;
}

export interface FilterChipsProps<T extends string> {
  /** Optional visible heading rendered above the chip group. */
  label?: string;
  /** Accessible group name announced by screen readers. */
  ariaLabel: string;
  /** Available filter options rendered in order. */
  options: readonly FilterChipOption<T>[];
  /** Currently active option ID, or array of selected IDs when `multiple` is true. */
  selected: T | readonly T[];
  /** Whether multiple options can be active simultaneously. */
  multiple?: boolean;
  /** Called with the tapped option ID. */
  onToggle: (id: T) => void;
  /** Disables all chips in the group when true. */
  disabled?: boolean;
  className?: string;
}

/** Accessible single- or multi-select filter chip group. */
export function FilterChips<T extends string>({
  label,
  ariaLabel,
  options,
  selected,
  multiple = false,
  onToggle,
  disabled = false,
  className = "",
}: FilterChipsProps<T>) {
  const isSelected = (id: T) =>
    multiple && Array.isArray(selected) ? selected.includes(id) : selected === id;

  return (
    <div className={`ls-chip-group ${className}`.trim()}>
      {label && <span className="ls-chip-group-label">{label}</span>}
      <div className="ls-chip-group-items" role="group" aria-label={ariaLabel}>
        {options.map((option) => (
          <Chip
            key={option.id}
            selected={isSelected(option.id)}
            disabled={disabled}
            aria-label={option.chipAriaLabel ?? option.label}
            onClick={() => onToggle(option.id)}
          >
            {option.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}
