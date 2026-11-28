import type { AgeBand, Domain } from "../catalog/types";
import type { MilestonePrompt } from "./types";

/** Published early learning reference backing bundled milestone cues. */
export const PROMPT_SOURCE = "CDC Developmental Milestones & Early Learning Guidelines";

const makePrompt = (
  id: string,
  domain: Domain,
  ageBand: AgeBand,
  title: string,
  indicators: string[]
): MilestonePrompt => ({
  id,
  domain,
  ageBand,
  title,
  indicators,
  provenanceSource: PROMPT_SOURCE,
  reviewStatus: "source_checked",
});

/** Bundled multi-age-band milestone prompts used immediately and as offline fallback. */
export const MILESTONE_PROMPTS: MilestonePrompt[] = [
  // 0–5 months
  makePrompt("ms-cog-0-5m-01", "cognitive", "0-5m", "Follows moving faces or toys", [
    "Watches your face as you talk",
    "Tracks a bright toy moving slowly side to side",
  ]),
  makePrompt("ms-mot-0-5m-01", "motor", "0-5m", "Lifts head during tummy time", [
    "Holds head up briefly on a firm mat",
    "Pushes up slightly on forearms",
  ]),
  makePrompt("ms-lan-0-5m-01", "language", "0-5m", "Coos and turns toward familiar voices", [
    "Makes soft vowel sounds when relaxed",
    "Turns toward your voice or a gentle song",
  ]),
  makePrompt("ms-soc-0-5m-01", "socioEmotional", "0-5m", "Smiles back at familiar people", [
    "Calms when held or spoken to gently",
    "Smiles when you smile and talk closely",
  ]),

  // 6–11 months
  makePrompt("ms-cog-6-11m-01", "cognitive", "6-11m", "Explores objects with hands and eyes", [
    "Passes a toy from one hand to the other",
    "Looks for a toy that drops out of sight",
  ]),
  makePrompt("ms-mot-6-11m-01", "motor", "6-11m", "Sits with little or no support", [
    "Balances while reaching for a nearby toy",
    "Rolls or scoots toward interesting objects",
  ]),
  makePrompt("ms-lan-6-11m-01", "language", "6-11m", "Babbles strings of sounds", [
    "Repeats sounds like ma-ma or ba-ba",
    "Responds when you call their name",
  ]),
  makePrompt("ms-soc-6-11m-01", "socioEmotional", "6-11m", "Enjoys back-and-forth games", [
    "Laughs or smiles during peek-a-boo",
    "Reaches out to familiar caregivers",
  ]),

  // 12–23 months
  makePrompt("fx-cog-12-23m-01", "cognitive", "12-23m", "Finds a hidden toy", [
    "Looks for a toy under a cloth",
    "Watches where you put things",
  ]),
  makePrompt("fx-cog-12-23m-02", "cognitive", "12-23m", "Stacks two blocks", [
    "Puts one block on another",
    "Tries again if the tower falls",
  ]),
  makePrompt("fx-mot-12-23m-01", "motor", "12-23m", "Takes a few steps alone", [
    "Lets go of furniture",
    "Walks a short way to you",
  ]),
  makePrompt("fx-mot-12-23m-02", "motor", "12-23m", "Scribbles with a crayon", [
    "Holds a crayon in a fist",
    "Makes marks on paper",
  ]),
  makePrompt("fx-lan-12-23m-01", "language", "12-23m", "Uses a few simple words", [
    "Says words like mama or ball",
    "Points and names things",
  ]),
  makePrompt("fx-lan-12-23m-02", "language", "12-23m", "Follows a simple request", [
    "Hands you a toy when asked",
    "Waves bye-bye with a prompt",
  ]),
  makePrompt("fx-soc-12-23m-01", "socioEmotional", "12-23m", "Shows what they like", [
    "Brings you a favorite book",
    "Smiles at familiar people",
  ]),
  makePrompt("fx-soc-12-23m-02", "socioEmotional", "12-23m", "Plays beside other children", [
    "Watches others play",
    "Copies a simple action",
  ]),

  // 24–35 months
  makePrompt("ms-cog-24-35m-01", "cognitive", "24-35m", "Sorts objects by shape or color", [
    "Groups similar cups, lids, or blocks together",
    "Tries simple pretend play like feeding a doll",
  ]),
  makePrompt("ms-mot-24-35m-01", "motor", "24-35m", "Kicks a ball and climbs steadily", [
    "Kicks a soft ball forward",
    "Turns pages in a sturdy picture book",
  ]),
  makePrompt("ms-lan-24-35m-01", "language", "24-35m", "Puts two words together", [
    "Says phrases like 'more milk' or 'big dog'",
    "Points to pictures when you name them",
  ]),
  makePrompt("ms-soc-24-35m-01", "socioEmotional", "24-35m", "Notices how others feel", [
    "Pauses or looks concerned when someone is upset",
    "Looks at your face to check your reaction",
  ]),

  // 36–47 months
  makePrompt("ms-cog-36-47m-01", "cognitive", "36-47m", "Plays imaginative pretend games", [
    "Turns everyday items into props during play",
    "Matches simple shapes or completes a 3-piece puzzle",
  ]),
  makePrompt("ms-mot-36-47m-01", "motor", "36-47m", "Strings large beads or draws circles", [
    "Uses both hands together to thread or build",
    "Runs smoothly and avoids obstacles",
  ]),
  makePrompt("ms-lan-36-47m-01", "language", "36-47m", "Has short back-and-forth chats", [
    "Asks 'who', 'what', or 'where' questions",
    "Tells you about something that happened today",
  ]),
  makePrompt("ms-soc-36-47m-01", "socioEmotional", "36-47m", "Takes turns with a little help", [
    "Joins in a simple game with another child or adult",
    "Calms down within a few minutes after a transition",
  ]),

  // 48–59 months
  makePrompt("ms-cog-48-59m-01", "cognitive", "48-59m", "Counts a small group of items", [
    "Counts everyday objects like spoons or blocks",
    "Predicts what might happen next in a familiar story",
  ]),
  makePrompt("ms-mot-48-59m-01", "motor", "48-59m", "Catches a bounced ball and draws shapes", [
    "Holds a crayon or pencil between fingers and thumb",
    "Hops or balances briefly on one foot",
  ]),
  makePrompt("ms-lan-48-59m-01", "language", "48-59m", "Retells part of a favorite story", [
    "Uses full sentences during play or mealtime",
    "Answers simple questions about a book you read",
  ]),
  makePrompt("ms-soc-48-59m-01", "socioEmotional", "48-59m", "Comforts or helps a playmate", [
    "Shows kindness when someone is sad or hurt",
    "Follows simple shared rules during a game",
  ]),

  // 60–71 months
  makePrompt("ms-cog-60-71m-01", "cognitive", "60-71m", "Follows multi-step play instructions", [
    "Plans a drawing or block structure ahead of time",
    "Notices patterns in songs, stories, or everyday objects",
  ]),
  makePrompt("ms-mot-60-71m-01", "motor", "60-71m", "Writes familiar letters and hops with ease", [
    "Buttons clothing or uses child-safe scissors carefully",
    "Skips, hops, or balances during active outdoor play",
  ]),
  makePrompt("ms-lan-60-71m-01", "language", "60-71m", "Tells a story with clear events", [
    "Explains how a game works in their own words",
    "Recognizes rhyming words in songs and books",
  ]),
  makePrompt("ms-soc-60-71m-01", "socioEmotional", "60-71m", "Shares ideas and negotiates play roles", [
    "Takes turns fairly in group games",
    "Talks about feelings when something is tricky",
  ]),
];

/** Returns bundled milestone prompts matching `ageBand`. */
export const promptsFor = (ageBand: AgeBand) =>
  MILESTONE_PROMPTS.filter((prompt) => prompt.ageBand === ageBand);
