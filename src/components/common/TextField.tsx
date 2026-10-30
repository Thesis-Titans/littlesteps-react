import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

type Shared = {
  label: string;
  hint?: string;
  /** Message shown under the field; marks it invalid. */
  error?: string;
};

type TextFieldProps =
  | (Shared & { multiline?: false } & Omit<InputHTMLAttributes<HTMLInputElement>, "id">)
  | (Shared & { multiline: true } & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id">);

export function TextField(props: TextFieldProps) {
  const id = useId();
  const { label, hint, error, multiline, className = "", ...field } = props;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const length = String(field.value ?? "").length;
  const common = { id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy, className: "ls-control" };

  return (
    <div className={`ls-field ${error ? "ls-field-error" : ""} ${className}`}>
      <label htmlFor={id} className="ls-field-label">{label}</label>
      {multiline
        ? <textarea {...common} {...(field as TextareaHTMLAttributes<HTMLTextAreaElement>)} />
        : <input {...common} {...(field as InputHTMLAttributes<HTMLInputElement>)} />}
      {hint && <p id={hintId} className="ls-field-hint">{hint}</p>}
      {error && <p id={errorId} className="ls-field-message" role="alert">{error}</p>}
      {field.maxLength !== undefined && (
        <p className="ls-field-count" aria-live="polite">{length.toLocaleString()} / {field.maxLength.toLocaleString()}</p>
      )}
    </div>
  );
}
