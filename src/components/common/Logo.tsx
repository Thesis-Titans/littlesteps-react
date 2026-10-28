import growthSymbol from "../../assets/brand/brandmark.svg";

const TAGLINE = "Small steps. Brighter tomorrows.";

export function Logo({ variant, className = "" }: { variant: "horizontal" | "stacked"; className?: string }) {
  return (
    <div className={`logo logo-${variant} ${className}`}>
      <img className="logo-symbol" src={growthSymbol} alt="" />
      <div className="logo-wordmark">
        <p className="logo-name">LittleSteps</p>
        <p className="logo-tagline">{TAGLINE}</p>
      </div>
    </div>
  );
}
