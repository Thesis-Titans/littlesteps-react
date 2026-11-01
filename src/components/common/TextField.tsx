import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";

type Shared = {
  id?: string;
  label: string;
  hint?: string;
  /** Message shown under the field; marks it invalid. */
  error?: string;
  /** Trailing content (e.g. password visibility toggle button) */
  trailing?: ReactNode;
};

type TextFieldProps =
  | (Shared & { multiline?: false } & Omit<InputHTMLAttributes<HTMLInputElement>, "id">)
  | (Shared & { multiline: true } & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id">);

export function TextField(props: TextFieldProps) {
  const generatedId = useId();
  const { label, hint, error, multiline, className = "", trailing, id: explicitId, ...field } = props;
  const id = explicitId ?? generatedId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const length = String(field.value ?? "").length;
  const common = {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    className: `ls-control ${trailing ? "ls-control-with-trailing" : ""}`,
  };

  return (
    <div className={`ls-field ${error ? "ls-field-error" : ""} ${className}`}>
      <label htmlFor={id} className="ls-field-label">{label}</label>
      {trailing ? (
        <div className="ls-input-wrapper">
          <input {...common} {...(field as InputHTMLAttributes<HTMLInputElement>)} />
          <div className="ls-input-trailing">{trailing}</div>
        </div>
      ) : multiline ? (
        <textarea {...common} {...(field as TextareaHTMLAttributes<HTMLTextAreaElement>)} />
      ) : (
        <input {...common} {...(field as InputHTMLAttributes<HTMLInputElement>)} />
      )}
      {hint && <p id={hintId} className="ls-field-hint">{hint}</p>}
      {error && <p id={errorId} className="ls-field-message">{error}</p>}
      {field.maxLength !== undefined && (
        <p className="ls-field-count" aria-live="polite">{length.toLocaleString()} / {field.maxLength.toLocaleString()}</p>
      )}
    </div>
  );
}
