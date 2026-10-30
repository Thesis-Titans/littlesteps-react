import { FirebaseError } from "firebase/app";

export type CreateAccountField = "email" | "password" | "privacy";
export type CreateAccountErrors = Partial<Record<CreateAccountField | "form", string>>;

export const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Passwords are never trimmed or restricted by character type; pasting and managers must work (WCAG 3.3.8). */
export function validateCreateAccount(input: { email: string; password: string; acceptedPrivacy: boolean }): CreateAccountErrors {
  const errors: CreateAccountErrors = {};
  if (!EMAIL_PATTERN.test(input.email.trim())) errors.email = "Enter an email address like you@example.com.";
  if (input.password.length < MIN_PASSWORD_LENGTH) errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (!input.acceptedPrivacy) errors.privacy = "Please confirm you have read the privacy notice.";
  return errors;
}

/**
 * Firebase email/password sign-up can only say "email already in use", so an existing address is revealed.
 * Accepted for now; turning on email enumeration protection would hide it but changes this flow.
 */
export function describeCreateAccountError(error: unknown): CreateAccountErrors {
  const code = error instanceof FirebaseError ? error.code : "";
  switch (code) {
    case "auth/email-already-in-use":
      return { email: "This email can't be used for a new account. Try signing in instead." };
    case "auth/invalid-email":
      return { email: "Enter an email address like you@example.com." };
    case "auth/weak-password":
      return { password: `Use at least ${MIN_PASSWORD_LENGTH} characters.` };
    case "auth/network-request-failed":
      return { form: "We couldn't reach the service. Check your connection and try again." };
    default:
      return { form: "Something went wrong while creating your account. Please try again." };
  }
}
