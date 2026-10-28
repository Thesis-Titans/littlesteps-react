import { useState, type FormEvent } from "react";
import { FirebaseError } from "firebase/app";
import { useAuth } from "../useAuth";
import { Logo } from "../../../components/common/Logo";
import iconCheck from "../../../assets/icons/check-forest-20.svg";
import iconLock from "../../../assets/icons/lock.svg";
import illustration from "../../../assets/illustrations/illustration-parent-child.svg";
import leafDesktop1 from "../../../assets/illustrations/leaf-desktop-1.svg";
import leafDesktop2 from "../../../assets/illustrations/leaf-desktop-2.svg";
import leafDesktop3 from "../../../assets/illustrations/leaf-desktop-3.svg";
import leafMobile1 from "../../../assets/illustrations/leaf-mobile-1.svg";
import leafMobile2 from "../../../assets/illustrations/leaf-mobile-2.svg";
import leafMobile3 from "../../../assets/illustrations/leaf-mobile-3.svg";

const PROMISES = [
  "Plan activities and record observations.",
  "Journal text is not sent to AI, analytics or error logs.",
  "Every activity shows where it comes from.",
];

function describeSignInError(error: unknown): string {
  if (error instanceof FirebaseError) {
    if (["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found", "auth/invalid-email"].includes(error.code)) {
      return "That email and password don't match an account. Please check them and try again.";
    }
    if (error.code === "auth/too-many-requests") return "Too many attempts. Please wait a moment and try again.";
    if (error.code === "auth/network-request-failed") return "We couldn't reach the sign-in service. Check your connection and try again.";
  }
  return "Something went wrong while signing in. Please try again.";
}

export function SignInForm({ notice }: { notice?: string }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          <p>Plan short play ideas, notice small moments and keep private notes for the children you care for.</p>
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
            <h1 id="sign-in-title">
              <span className="desktop-only">Sign in</span>
              <span className="mobile-only">Welcome back</span>
            </h1>
            <p className="desktop-only">Enter your email and password.</p>
            <p className="mobile-only">Sign in to plan play, notice milestones and keep private notes.</p>
          </div>
          {notice && !error && <p className="auth-notice" role="status">{notice}</p>}
          {error && <p className="auth-error" role="alert">{error}</p>}
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
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
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={error ? true : undefined}
              />
            </div>
            <div className="password-help">
              <button
                type="button"
                className="text-button"
                aria-controls="password"
                aria-pressed={showPassword}
                onClick={() => setShowPassword((shown) => !shown)}
              >
                {showPassword ? "Hide password" : "Show password"}
              </button>
              {/* shortcut: route not built yet, wire up when password reset lands */}
              <a className="text-button" href="/forgot-password">Forgot password?</a>
            </div>
            <button type="submit" className="primary-button" disabled={submitting} aria-busy={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p className="auth-new">New to LittleSteps?</p>
          {/* shortcut: route not built yet, wire up when registration lands */}
          <a className="secondary-button" href="/create-account">Create an account</a>
          <p className="privacy-note">
            <img src={iconLock} alt="" width={16} height={16} />
            You will read the privacy notice before creating an account.
          </p>
        </section>
      </div>
    </main>
  );
}
