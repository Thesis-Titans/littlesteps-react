import { Button } from "../../components/common";
import { ScreenHeader } from "../../components/layout";
import { useAuth } from "../auth";

/** Account screen – Sprint 1 stub so the route exists. Issue #16 builds settings, privacy and help. */
export function AccountScreen() {
  const { user, signOut } = useAuth();
  return (
    <section className="screen" aria-labelledby="account-title">
      <ScreenHeader id="account-title" title="Account" subtitle={user?.email ?? undefined} childScoped={false} />
      <Button variant="secondary" onClick={() => void signOut()}>Sign out</Button>
    </section>
  );
}
