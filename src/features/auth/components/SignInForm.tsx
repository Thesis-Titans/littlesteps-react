import { useId, useState, type FormEvent } from "react";
import { FirebaseError } from "firebase/app";
import { Link } from "react-router-dom";
import iconCheck from "../../../assets/icons/check-forest-20.svg";
import illustration from "../../../assets/illustrations/illustration-parent-child.svg";
import leafDesktop1 from "../../../assets/illustrations/leaf-desktop-1.svg";
import leafDesktop2 from "../../../assets/illustrations/leaf-desktop-2.svg";
import leafDesktop3 from "../../../assets/illustrations/leaf-desktop-3.svg";
import leafMobile1 from "../../../assets/illustrations/leaf-mobile-1.svg";
import leafMobile2 from "../../../assets/illustrations/leaf-mobile-2.svg";
import leafMobile3 from "../../../assets/illustrations/leaf-mobile-3.svg";
import {
  Button,
  InlineAlert,
  ModalDialog,
  PasswordField,
  TextField,
} from "../../../components/common";
import { Logo } from "../../../components/common/Logo";
import { useAuth } from "../useAuth";

const PROMISES = [
  "Plan play and note what you can.",
  "Your journal stays private.",
  "Every activity shows where it comes from.",
];

function describeSignInError(error: unknown): string {
  if (error instanceof FirebaseError) {
    if (
      [
        "auth/invalid-credential",
        "auth/wrong-password",
        "auth/user-not-found",
        "auth/invalid-email",
      ].includes(error.code)
    ) {
      return "That email and password don't match an account. Please check them and try again.";
    }
    if (error.code === "auth/too-many-requests") {
      return "Too many attempts. Please wait a moment and try again.";
    }
    if (error.code === "auth/network-request-failed") {
      return "We couldn't reach the sign-in service. Check your connection and try again.";
    }
  }
  return "Something went wrong while signing in. Please try again.";
}

/** Caregiver sign-in screen with brand overview and inline password reset dialog. */
export function SignInForm({ notice }: { notice?: string }) {
  const { signIn, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<{ kind: "info" | "error"; text: string } | null>(
    null
  );
  const resetTitleId = useId();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (signInError) {
      setError(describeSignInError(signInError));
      setSubmitting(false);
    }
  }

  function openResetDialog() {
    setResetEmail(email.trim());
    setResetFeedback(null);
    setResetOpen(true);
  }

  async function handlePasswordReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = resetEmail.trim();
    if (!target || !target.includes("@")) {
      setResetFeedback({ kind: "error", text: "Enter the email address for your account." });
      return;
    }
    setResetBusy(true);
    setResetFeedback(null);
    try {
      if (resetPassword) {
        await resetPassword(target);
      }
      setResetFeedback({
        kind: "info",
        text: "If an account matches that email, a password reset link has been sent.",
      });
    } catch (resetError) {
      const offline =
        resetError instanceof FirebaseError &&
        resetError.code === "auth/network-request-failed";
      setResetFeedback({
        kind: "error",
        text: offline
          ? "We couldn't reach the sign-in service. Check your connection and try again."
          : "Could not send a reset email right now. Please check the address and try again.",
      });
    } finally {
      setResetBusy(false);
    }
  }

  return (
    <main className="sign-in-page">
      <section className="brand-panel" aria-label="About LittleSteps">
        <img className="leaf leaf-mobile-1" src={leafMobile1} alt="" />
        <img className="leaf leaf-mobile-2" src={leafMobile2} alt="" />
        <img className="leaf leaf-mobile-3" src={leafMobile3} alt="" />
        <Logo variant="horizontal" className="desktop-only" />
        <Logo variant="stacked" className="mobile-only" />
        <div className="brand-copy desktop-only">
          <p className="brand-headline">Welcome back</p>
          <p>
            Plan short play ideas, notice small moments and keep private notes for the children you care for.
          </p>
          <ul className="promises">
            {PROMISES.map((promise) => (
              <li key={promise}>
                <img src={iconCheck} alt="" width={20} height={20} />
                {promise}
              </li>
            ))}
          </ul>
        </div>
        <div className="brand-illustration desktop-only">
          <img className="leaf leaf-desktop-1" src={leafDesktop1} alt="" />
          <img className="leaf leaf-desktop-2" src={leafDesktop2} alt="" />
          <img className="leaf leaf-desktop-3" src={leafDesktop3} alt="" />
          <img className="illustration" src={illustration} alt="" />
        </div>
      </section>

      <div className="form-area">
        <section className="auth-card" aria-labelledby="sign-in-title">
          <div className="auth-heading">
            <h1 id="sign-in-title">Sign in</h1>
          </div>
          {notice && !error && (
            <p className="auth-notice" role="status">
              {notice}
            </p>
          )}
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          <form onSubmit={(e) => void handleSubmit(e)} noValidate>
            <TextField
              id="email"
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={error ? true : undefined}
            />
            <PasswordField
              id="password"
              label="Password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={error ? true : undefined}
            />
            <div className="forgot-password-row">
              <button
                type="button"
                className="forgot-password-link"
                onClick={openResetDialog}
              >
                Forgot password?
              </button>
            </div>
            <Button type="submit" fullWidth busy={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <Link className="secondary-button" to="/create-account">
            Create account
          </Link>
        </section>
      </div>

      {resetOpen && (
        <ModalDialog
          open
          labelledBy={resetTitleId}
          onClose={() => setResetOpen(false)}
        >
          <form onSubmit={(e) => void handlePasswordReset(e)} noValidate className="auth-reset-form">
            <h2 id={resetTitleId} className="ls-dialog-title">
              Reset your password
            </h2>
            <p className="ls-dialog-body">
              Enter your account email and we&apos;ll send a link to choose a new password.
            </p>
            <TextField
              label="Email"
              type="email"
              name="resetEmail"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              value={resetEmail}
              onChange={(event) => setResetEmail(event.target.value)}
            />
            {resetFeedback && (
              <InlineAlert
                kind={resetFeedback.kind}
                title={resetFeedback.kind === "info" ? "Check your inbox" : "Could not send link"}
              >
                <p>{resetFeedback.text}</p>
              </InlineAlert>
            )}
            <div className="ls-dialog-actions">
              <Button variant="secondary" onClick={() => setResetOpen(false)}>
                Close
              </Button>
              <Button type="submit" busy={resetBusy}>
                {resetBusy ? "Sending…" : "Send reset link"}
              </Button>
            </div>
          </form>
        </ModalDialog>
      )}
    </main>
  );
}
