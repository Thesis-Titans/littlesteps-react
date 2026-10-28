import { useId, type SelectHTMLAttributes } from "react";
import { Icon } from "./Icon";

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> & {
  label: string;
  options: { value: string; label: string }[];
  hint?: string;
  error?: string;
};

export function Select({ label, options, hint, error, className = "", ...rest }: SelectProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={`ls-field ${error ? "ls-field-error" : ""} ${className}`}>
      <label htmlFor={id} className="ls-field-label">{label}</label>
      <div className="ls-select">
        <select
          id={id}
          className="ls-control"
          aria-invalid={error ? true : undefined}
          aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
          {...rest}
        >
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <Icon name="chevron-down" className="ls-select-chevron" />
      </div>
      {hint && <p id={hintId} className="ls-field-hint">{hint}</p>}
      {error && <p id={errorId} className="ls-field-message">{error}</p>}
    </div>
  );
}
