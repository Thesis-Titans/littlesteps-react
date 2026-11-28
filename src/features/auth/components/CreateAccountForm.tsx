import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button, InlineAlert, PasswordField, TextField } from "../../../components/common";
import { PRIVACY_CONTACT } from "../../account/content";
import {
  describeCreateAccountError,
  validateCreateAccount,
  type CreateAccountErrors,
} from "../createAccount";
import { useAuth } from "../useAuth";
import { AuthBrandPanel } from "./AuthBrandPanel";

const PRIVACY_POINTS = [
  ["What we collect", "A child nickname, birth month and year (or age range), activity records, saved storybooks, and your notes."],
  ["Why", "To suggest age-suitable activities and keep your own record."],
  ["Who sees it", "You. Notes never go to AI, analytics, or error logs."],
  ["Your rights", "You can view, edit, download a copy of your data, or permanently delete your account in Settings."],
  ["How long we keep it", "While your account is active, until you choose to delete your account in Settings."],
  ["If something goes wrong", "We will notify you and the National Privacy Commission as soon as possible and aim to do so within 72 hours."],
  ["Contact", PRIVACY_CONTACT],
] as const;

/** Signed-out sign-up form. Success signs the caregiver in and routes to `/today`. */
export function CreateAccountForm() {
  const { createAccount } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [errors, setErrors] = useState<CreateAccountErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const formAlert = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.title;
    document.title = "Create an account · LittleSteps";
    return () => {
      document.title = previous;
    };
  }, []);

  const fail = (next: CreateAccountErrors) => {
    setErrors(next);
    setSubmitting(false);
    requestAnimationFrame(() =>
      (formAlert.current ?? form.current?.querySelector<HTMLElement>('[aria-invalid="true"]'))?.focus()
    );
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found = validateCreateAccount({ email, password, acceptedPrivacy });
    if (Object.keys(found).length) return fail(found);
    setSubmitting(true);
    setErrors({});
    try {
      await createAccount(email.trim(), password);
    } catch (error) {
      fail(describeCreateAccountError(error));
    }
  }

  return (
    <main className="sign-in-page">
      <AuthBrandPanel
        headline="Start small, play often"
        description="Set up your caregiver space in under a minute to plan everyday screen-free play and keep private notes."
      />
      <div className="form-area">
        <section className="auth-card" aria-labelledby="create-account-title">
          <div className="auth-heading">
            <h1 id="create-account-title">Create an account</h1>
            <p>For parents and guardians who add their own child&apos;s details.</p>
          </div>
          <form ref={form} onSubmit={(e) => void handleSubmit(e)} noValidate>
            {errors.form && (
              <InlineAlert
                ref={formAlert}
                tabIndex={-1}
                kind="error"
                title="We couldn't create your account."
              >
                {errors.form}
              </InlineAlert>
            )}
            <TextField
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              value={email}
              error={errors.email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <PasswordField
              label="Password"
              hint="At least 8 characters. A password manager is welcome."
              name="password"
              autoComplete="new-password"
              value={password}
              error={errors.password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <details className="privacy-disclosure" id="privacy-notice">
              <summary>Read the privacy notice</summary>
              <dl>
                {PRIVACY_POINTS.map(([term, text]) => (
                  <div key={term}>
                    <dt>{term}</dt>
                    <dd>{text}</dd>
                  </div>
                ))}
              </dl>
              <p>The full notice is in Account after you sign up.</p>
            </details>
            <div className="field">
              <label className="check-row">
                <input
                  type="checkbox"
                  name="privacy"
                  checked={acceptedPrivacy}
                  aria-invalid={errors.privacy ? true : undefined}
                  aria-describedby={errors.privacy ? "privacy-error" : undefined}
                  onChange={(event) => setAcceptedPrivacy(event.target.checked)}
                />
                I have read the privacy summary above
              </label>
              {errors.privacy && (
                <p id="privacy-error" className="ls-field-message">
                  {errors.privacy}
                </p>
              )}
            </div>
            <Button type="submit" fullWidth busy={submitting}>
              {submitting ? "Creating account…" : "Create account"}
            </Button>
          </form>
          <p className="auth-new">
            Already have an account?{" "}
            <Link className="text-button" to="/">
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
