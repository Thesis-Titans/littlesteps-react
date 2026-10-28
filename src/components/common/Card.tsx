import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: "div" | "section" | "article" | "li";
  /** Adds the card shadow; use for cards that sit on the canvas, not for cards inside cards. */
  elevated?: boolean;
};

export function Card({ as: Tag = "div", elevated = false, className = "", ...rest }: CardProps) {
  return <Tag className={`ls-card${elevated ? " ls-card-elevated" : ""} ${className}`} {...rest} />;
}
