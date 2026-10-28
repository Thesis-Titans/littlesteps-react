import type { ButtonHTMLAttributes } from "react";

type ChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & { selected?: boolean };

/** A filter or choice chip. Announced as a toggle button, so screen readers hear "selected". */
export function Chip({ selected = false, className = "", ...rest }: ChipProps) {
  return <button type="button" className={`ls-chip ${className}`} aria-pressed={selected} {...rest} />;
}
