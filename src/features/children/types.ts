export const AGE_BANDS = ["0-5m", "6-11m", "12-23m", "24-35m", "36-47m", "48-59m", "60-71m"] as const;
export type AgeBand = (typeof AGE_BANDS)[number];

export const isAgeBand = (value: unknown): value is AgeBand => AGE_BANDS.includes(value as AgeBand);

/** Parent-friendly text for an age band, e.g. "12–23 months". */
export function ageBandLabel(band: AgeBand): string {
  if (!isAgeBand(band)) return "Age not set";
  return `${band.replace("m", "").replace("-", "–")} months`;
}

export type Child = {
  id: string;
  nickname: string;
  /** Birth month as "YYYY-MM"; omitted when the caregiver chose an age range instead. */
  birthMonthYear?: string;
  ageBand: AgeBand;
  createdAt: string;
  updatedAt: string;
};

/** Exactly one of birthMonthYear or ageBand. */
type AgeSource =
  | { birthMonthYear: string; ageBand?: never }
  | { ageBand: AgeBand; birthMonthYear?: never };

export type CreateChildInput = { nickname: string } & AgeSource;

/** nickname and/or one age source; an empty update is rejected by the API. */
export type UpdateChildInput = { nickname?: string } & (AgeSource | { birthMonthYear?: never; ageBand?: never });

export type ChildStatus = "loading" | "ready" | "error" | "offline";

export type ChildState = {
  children: Child[];
  activeChild: Child | null;
  status: ChildStatus;
  error: Error | null;
  setActiveChild: (child: Child | null) => void;
  refresh: () => void;
  /** Creates the child, adds it to the list and makes it the active child. */
  addChild: (input: CreateChildInput) => Promise<Child>;
  editChild: (childId: string, input: UpdateChildInput) => Promise<Child>;
};
