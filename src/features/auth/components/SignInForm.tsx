import { useState, type FormEvent } from "react";
import { FirebaseError } from "firebase/app";
import { useAuth } from "../useAuth";

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
    <section className="auth-card" aria-labelledby="sign-in-title">
      <h1 id="sign-in-title">Sign in</h1>
      <p className="auth-copy">Welcome back. Sign in with your caregiver account.</p>
      {notice && !error && <p className="auth-notice" role="status">{notice}</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={error ? true : undefined}
        />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={error ? true : undefined}
        />
        <p className="privacy-note">Your information stays private to your caregiver account.</p>
        <button type="submit" className="primary-button" disabled={submitting} aria-busy={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </section>
  );
}
