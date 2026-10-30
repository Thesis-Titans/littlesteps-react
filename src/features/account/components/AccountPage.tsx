import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ScreenHeader } from "../../../components/layout";
import { ACCOUNT_PATHS } from "../content";

/** Shared frame for the Account pages: back link, ScreenHeader (the only h1) and a labelled section. */
export function AccountPage({ id, title, subtitle, back = true, children }: { id: string; title: string; subtitle?: string; back?: boolean; children: ReactNode }) {
  return (
    <section className="screen account-page" aria-labelledby={id}>
      {back && <Link className="account-back" to={ACCOUNT_PATHS.menu}>‹ Account</Link>}
      <ScreenHeader id={id} title={title} subtitle={subtitle} childScoped={false} />
      {children}
    </section>
  );
}
