import type { ReactNode } from "react";

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <section className="ls-empty">
      <h2 className="ls-empty-title">{title}</h2>
      {children && <div className="ls-empty-text">{children}</div>}
      {action}
    </section>
  );
}
