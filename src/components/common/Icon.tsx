const sources = import.meta.glob<string>("../../assets/icons/*.svg", { query: "?raw", import: "default", eager: true });

// Figma exports a fixed stroke color; swap it so icons follow the text color around them.
const icons = Object.fromEntries(
  Object.entries(sources).map(([path, svg]) => [
    path.slice(path.lastIndexOf("/") + 1, -4),
    svg.replace(/stroke="#[0-9a-fA-F]{6}"/g, 'stroke="currentColor"'),
  ])
);

export type IconName =
  | "today" | "explore" | "milestones" | "journal" | "this-week"
  | "lock" | "check" | "clock" | "info" | "sparkle"
  | "chevron-down" | "chevron-right" | "close" | "plus" | "wifi-off";

type IconProps = {
  name: IconName;
  size?: 16 | 20 | 24;
  /** Give a label only when the icon is the sole content of a control; otherwise it is decorative. */
  label?: string;
  className?: string;
};

export function Icon({ name, size = 20, label, className = "" }: IconProps) {
  return (
    <span
      className={`ls-icon ${className}`}
      style={{ width: size, height: size }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      dangerouslySetInnerHTML={{ __html: icons[name] ?? "" }}
    />
  );
}
