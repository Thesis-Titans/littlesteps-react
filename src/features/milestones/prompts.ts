import type { AgeBand, Domain } from "../catalog/types";
import type { MilestonePrompt } from "./types";

// SYNTHETIC FIXTURES: invented wording for building the screen. Replace with reviewed prompts when docs #3 is resolved.
export const PROMPT_SOURCE = "Source: early learning guide · still being checked";

const p = (id: string, domain: Domain, ageBand: AgeBand, title: string, indicators: string[]): MilestonePrompt => ({
  id,
  domain,
  ageBand,
  title,
  indicators,
  provenanceSource: PROMPT_SOURCE,
  reviewStatus: "synthetic_fixture",
});

export const MILESTONE_PROMPTS: MilestonePrompt[] = [
  p("fx-cog-12-23m-01", "cognitive", "12-23m", "Finds a hidden toy", ["Looks for a toy under a cloth", "Watches where you put things"]),
  p("fx-cog-12-23m-02", "cognitive", "12-23m", "Stacks two blocks", ["Puts one block on another", "Tries again if the tower falls"]),
  p("fx-mot-12-23m-01", "motor", "12-23m", "Takes a few steps alone", ["Lets go of furniture", "Walks a short way to you"]),
  p("fx-mot-12-23m-02", "motor", "12-23m", "Scribbles with a crayon", ["Holds a crayon in a fist", "Makes marks on paper"]),
  p("fx-lan-12-23m-01", "language", "12-23m", "Uses a few simple words", ["Says words like mama or ball", "Points and names things"]),
  p("fx-lan-12-23m-02", "language", "12-23m", "Follows a simple request", ["Hands you a toy when asked", "Waves bye-bye with a prompt"]),
  p("fx-soc-12-23m-01", "socioEmotional", "12-23m", "Shows what they like", ["Brings you a favorite book", "Smiles at familiar people"]),
  p("fx-soc-12-23m-02", "socioEmotional", "12-23m", "Plays beside other children", ["Watches others play", "Copies a simple action"]),
];

export const promptsFor = (ageBand: AgeBand) => MILESTONE_PROMPTS.filter((prompt) => prompt.ageBand === ageBand);
