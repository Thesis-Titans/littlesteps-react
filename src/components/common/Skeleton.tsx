/** Loading placeholder. `label` is announced once; the shapes are hidden from screen readers. */
export function Skeleton({ kind = "card", label }: { kind?: "card" | "row" | "profile"; label: string }) {
  return (
    <div className={`ls-skeleton ls-skeleton-${kind}`}>
      <p className="ls-visually-hidden" role="status">{label}</p>
      <div aria-hidden="true">
        {kind === "profile" && <span className="ls-skeleton-avatar" />}
        <span className="ls-skeleton-line ls-skeleton-line-title" />
        <span className="ls-skeleton-line" />
        {kind === "card" && <span className="ls-skeleton-line ls-skeleton-line-short" />}
      </div>
    </div>
  );
}
