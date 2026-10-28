import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "text" | "danger";
  /** Shows the busy state and blocks repeat taps while an action runs. */
  busy?: boolean;
  fullWidth?: boolean;
};

export function Button({ variant = "primary", busy = false, fullWidth = false, type = "button", className = "", disabled, ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={`ls-button ls-button-${variant}${fullWidth ? " ls-button-full" : ""} ${className}`}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      {...rest}
    />
  );
}
