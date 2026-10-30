import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button, InlineAlert, TextField } from "../../../components/common";
import { Logo } from "../../../components/common/Logo";
import { describeCreateAccountError, validateCreateAccount, type CreateAccountErrors } from "../createAccount";
import { PRIVACY_CONTACT } from "../../account/content";
import { useAuth } from "../useAuth";

const PRIVACY_POINTS = [
  ["What we collect", "A child nickname, birth month and year, activity records and your notes."],
  ["Why", "To suggest age-suitable activities and keep your own record."],
  ["Who sees it", "You. Notes never go to AI, analytics or logs."],
  ["Your rights", "You can see and change what you entered in the app. Getting a copy and deleting are not available yet; we will add a contact for these requests."],
  ["How long we keep it", "While your account is active. Deleting on request is coming. Any inactivity period is only a proposal and not approved."],
  ["If something goes wrong", "We will tell you and the National Privacy Commission as soon as we can. We aim to do so within 72 hours, but that is a goal, not a promise."],
  ["Contact", PRIVACY_CONTACT],
] as const;

/** Signed-out sign-up. Success signs the person in; ProtectedRoute then sends them to /today. */
export function CreateAccountForm() {
  const { createAccount } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [errors, setErrors] = useState<CreateAccountErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const formAlert = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.title;
    document.title = "Create an account · LittleSteps";
    return () => { document.title = previous; };
  }, []);

  const fail = (next: CreateAccountErrors) => {
    setErrors(next);
    setSubmitting(false);
    requestAnimationFrame(() => (formAlert.current ?? form.current?.querySelector<HTMLElement>('[aria-invalid="true"]'))?.focus());
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
      <Logo variant="stacked" />
      <div className="form-area">
        <section className="auth-card" aria-labelledby="create-account-title">
          <div className="auth-heading">
            <h1 id="create-account-title">Create an account</h1>
            <p>For parents and guardians who add their own child's details.</p>
          </div>
          <form ref={form} onSubmit={handleSubmit} noValidate>
            {errors.form && <InlineAlert ref={formAlert} tabIndex={-1} kind="error" title="We couldn't create your account.">{errors.form}</InlineAlert>}
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
            <TextField
              label="Password"
              hint={`At least 8 characters. A password manager is welcome.`}
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="new-password"
              value={password}
              error={errors.password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button type="button" className="text-button" aria-pressed={showPassword} onClick={() => setShowPassword((shown) => !shown)}>
              Show password
            </button>
            <details className="privacy-disclosure" id="privacy-notice">
              <summary>Read the privacy notice</summary>
              <dl>
                {PRIVACY_POINTS.map(([term, text]) => (
                  <div key={term}><dt>{term}</dt><dd>{text}</dd></div>
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
              {errors.privacy && <p id="privacy-error" className="ls-field-message">{errors.privacy}</p>}
            </div>
            <Button type="submit" fullWidth busy={submitting}>{submitting ? "Creating account…" : "Create account"}</Button>
          </form>
          <p className="auth-new">Already have an account? <Link className="text-button" to="/">Sign in</Link></p>
        </section>
      </div>
    </main>
  );
}
