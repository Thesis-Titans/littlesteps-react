import { useEffect, useState, type ReactNode } from "react";
import { onIdTokenChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { auth } from "../../services/firebase";
import { AuthContext } from "./context";
import type { AuthState } from "./types";

// Module-level so their identity is stable across token refreshes.
async function signIn(email: string, password: string) {
  await signInWithEmailAndPassword(auth, email, password);
}
const signOutCaregiver = () => signOut(auth);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      onIdTokenChanged(auth, (nextUser) => {
        setUser(nextUser);
        setLoading(false);
      }),
    []
  );

  const value: AuthState = { user, loading, signIn, signOut: signOutCaregiver };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
