import { NON_DIAGNOSTIC_PLAY_DISCLAIMER } from "../../../config/externalLinks";
import type { CatalogActivity } from "../../catalog/types";

export interface PhilippineRhyme {
  id: string;
  title: string;
  subtitle: string;
  domain: "language" | "motor" | "cognitive" | "socioEmotional";
  domainLabel: string;
  language: "fil" | "hil" | "en";
  lyrics: string[];
  actionPrompt: string;
  materials: string[];
  durationMinutes: number;
}

export const PHILIPPINE_RHYMES: PhilippineRhyme[] = [
  {
    id: "rhyme-bahay-kubo",
    title: "Bahay Kubo",
    subtitle: "Traditional vegetable naming & rhythm song",
    domain: "cognitive",
    domainLabel: "Thinking",
    language: "fil",
    lyrics: [
      "Bahay kubo, kahit munti,",
      "Ang halaman doon ay sari-sari:",
      "Singkamas at talong, sigarilyas at mani,",
      "Sitaw, bataw, patani.",
      "Kundol, patola, upo't kalabasa,",
      "At saka mayroon pang labanos, mustasa,",
      "Sibuyas, kamatis, bawang at luya,",
      "Sa paligid-ligid ay puro linga."
    ],
    actionPrompt: "Clap to the beat and pretend to pick each vegetable from the ground as you sing its name!",
    materials: ["None required (optional: toy vegetables or drawing)"],
    durationMinutes: 5
  },
  {
    id: "rhyme-pakitong-kitong",
    title: "Tong, Tong, Tong Pakitong-kitong",
    subtitle: "Playful crab pinch & finger-movement song",
    domain: "motor",
    domainLabel: "Moving",
    language: "fil",
    lyrics: [
      "Tong, tong, tong, tong, pakitong-kitong,",
      "Alimango sa dagat, malaki at masarap!",
      "Kay hirap hulihin, sapagkat nangangagat,",
      "Tong, tong, tong, tong, pakitong-kitong!"
    ],
    actionPrompt: "Make crab claws with thumbs and index fingers. Pinch gently in the air on 'nangangagat'!",
    materials: ["None required"],
    durationMinutes: 5
  },
  {
    id: "rhyme-pen-pen",
    title: "Pen Pen de Sarapen",
    subtitle: "Rhythmic palm-tapping circle rhyme",
    domain: "socioEmotional",
    domainLabel: "Feelings & Bonding",
    language: "fil",
    lyrics: [
      "Pen, pen de sarapen,",
      "De kutsilyo, de almasen,",
      "Haw, haw de karabaw,",
      "Batuten!",
      "Sipit namimilipit,",
      "Ginto't pilak namumulaklak,",
      "Sa tabi ng dagat."
    ],
    actionPrompt: "Lay your hands flat on your laps. Gently tap each hand in rhythm on every syllable.",
    materials: ["None required"],
    durationMinutes: 5
  },
  {
    id: "rhyme-ako-may-lobo",
    title: "Ako ay May Lobo",
    subtitle: "Breath control & playful surprise rhyme",
    domain: "language",
    domainLabel: "Talking",
    language: "fil",
    lyrics: [
      "Ako ay may lobo, lumipad sa langit,",
      "'Di ko na nakita, pumutok na pala!",
      "Sayang ang pera ko, binili ng lobo,",
      "Sa pagkain sana, nabusog pa ako."
    ],
    actionPrompt: "Pretend to blow up a huge balloon with deep breaths, then clap loudly on 'Pumutok na pala!'",
    materials: ["None required"],
    durationMinutes: 5
  },
  {
    id: "rhyme-tatlong-bibe",
    title: "Tatlong Bibe",
    subtitle: "Gross-motor waddling & counting action song",
    domain: "motor",
    domainLabel: "Moving",
    language: "fil",
    lyrics: [
      "May tatlong bibe akong nakita,",
      "Mataba, mapayat, mga bibe,",
      "Ngunit ang may pakpak sa likod ay iisa,",
      "Siya ang lider na nagsabi ng 'Kwak, kwak!'",
      "Kwak, kwak, kwak! Kwak, kwak, kwak!",
      "Siya ang lider na nagsabi ng 'Kwak, kwak!'"
    ],
    actionPrompt: "Tuck elbows under armpits like duck wings, waddle side-to-side, and quack together enthusiastically!",
    materials: ["Room to waddle"],
    durationMinutes: 10
  }
];

export function rhymeToCatalogActivity(rhyme: PhilippineRhyme, childNickname?: string): CatalogActivity {
  return {
    id: rhyme.id,
    title: `Sing: ${rhyme.title}`,
    type: "rhyme",
    language: rhyme.language,
    setting: "indoor",
    ageBand: "12-23m",
    domain: rhyme.domain,
    durationMinutes: rhyme.durationMinutes,
    durationEstimate: `${rhyme.durationMinutes} mins`,
    materials: rhyme.materials,
    instructions: [
      `Sing "${rhyme.title}" together with ${childNickname ?? "your child"}.`,
      rhyme.actionPrompt,
      ...rhyme.lyrics.slice(0, 4),
    ],
    provenanceSource: "Traditional Philippine Nursery Rhyme · ECCD Early Learning Play",
    status: "source_checked",
    limitations: NON_DIAGNOSTIC_PLAY_DISCLAIMER,
  };
}

export const PHILIPPINE_RHYMES_CATALOG: CatalogActivity[] = PHILIPPINE_RHYMES.map((r) =>
  rhymeToCatalogActivity(r)
);
