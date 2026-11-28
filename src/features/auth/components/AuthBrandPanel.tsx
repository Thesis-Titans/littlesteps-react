import iconCheck from "../../../assets/icons/check-forest-20.svg";
import illustration from "../../../assets/illustrations/illustration-parent-child.svg";
import leafDesktop1 from "../../../assets/illustrations/leaf-desktop-1.svg";
import leafDesktop2 from "../../../assets/illustrations/leaf-desktop-2.svg";
import leafDesktop3 from "../../../assets/illustrations/leaf-desktop-3.svg";
import leafMobile1 from "../../../assets/illustrations/leaf-mobile-1.svg";
import leafMobile2 from "../../../assets/illustrations/leaf-mobile-2.svg";
import leafMobile3 from "../../../assets/illustrations/leaf-mobile-3.svg";
import { Logo } from "../../../components/common/Logo";

const PROMISES = [
  "Plan play and note what you can.",
  "Your journal stays private.",
  "Every activity shows where it comes from.",
];

export interface AuthBrandPanelProps {
  headline?: string;
  description?: string;
}

/**
 * Shared warm-cream split-pane brand panel used on Sign-In and Create Account screens.
 */
export function AuthBrandPanel({
  headline = "Welcome back",
  description = "Plan short play ideas, notice small moments and keep private notes for the children you care for.",
}: AuthBrandPanelProps) {
  return (
    <section className="brand-panel" aria-label="About LittleSteps">
      <img className="leaf leaf-mobile-1" src={leafMobile1} alt="" />
      <img className="leaf leaf-mobile-2" src={leafMobile2} alt="" />
      <img className="leaf leaf-mobile-3" src={leafMobile3} alt="" />
      <Logo variant="horizontal" className="desktop-only" />
      <Logo variant="stacked" className="mobile-only" />
      <div className="brand-copy desktop-only">
        <p className="brand-headline">{headline}</p>
        <p>{description}</p>
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
  );
}
