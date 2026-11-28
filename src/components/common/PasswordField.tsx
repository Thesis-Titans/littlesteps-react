import { useState, type InputHTMLAttributes } from "react";
import { Icon } from "./Icon";
import { TextField } from "./TextField";

export type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  hint?: string;
  error?: string;
};

/**
 * Password input with an accessible visibility toggle shared across authentication forms.
 */
export function PasswordField({ label, hint, error, ...rest }: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <TextField
      {...rest}
      label={label}
      hint={hint}
      error={error}
      type={showPassword ? "text" : "password"}
      trailing={
        <button
          type="button"
          className="password-toggle-btn"
          aria-label="Show password"
          aria-pressed={showPassword}
          onClick={() => setShowPassword((shown) => !shown)}
        >
          <Icon name={showPassword ? "eye-off" : "eye"} size={20} />
        </button>
      }
    />
  );
}
