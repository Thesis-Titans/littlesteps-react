import { ApiError, UnauthorizedError } from "../../services/api";
import { AGE_BANDS, ageBandLabel, isAgeBand } from "./types";
import type { Child, CreateChildInput, UpdateChildInput } from "./types";

/** "birth" = birth month and year; "band" = an age range. Exactly one is sent. */
export type AgeMode = "birth" | "band";
export type FormValues = { nickname: string; mode: AgeMode; month: string; year: string; band: string };
export type FieldErrors = { nickname?: string; age?: string; form?: string };

export const MAX_NICKNAME = 50;
const MAX_AGE_MONTHS = 71;

export const MSG = {
  nicknameMissing: "Add a nickname.",
  nicknameLong: `Use ${MAX_NICKNAME} characters or fewer.`,
  monthMissing: "Pick a birth month and year.",
  bandMissing: "Pick an age range.",
  ageRange: "Pick a birth month within the last six years, or choose an age range.",
  generic: "Add a nickname, then pick a birth month and year or an age range.",
  signedOut: "Please sign in again to continue.",
  notFound: "We can't find this profile. It may have been deleted.",
  notSaved: "We couldn't save this. Your changes weren't saved. Check your connection and try again."
} as const;

/** Trim and collapse inner whitespace, matching the API. */
export const normalizeNickname = (value: string) => value.trim().replace(/\s+/g, " ");

export function initialValues(child?: Child): FormValues {
  if (child?.birthMonthYear) {
    const [year, month] = child.birthMonthYear.split("-");
    return { nickname: child.nickname, mode: "birth", month, year, band: "" };
  }
  return { nickname: child?.nickname ?? "", mode: child ? "band" : "birth", month: "", year: "", band: child?.ageBand ?? "" };
}

const monthsOld = (year: number, month: number, now: Date) =>
  (now.getUTCFullYear() - year) * 12 + (now.getUTCMonth() + 1 - month);

export function validate(values: FormValues, now = new Date()): FieldErrors {
  const errors: FieldErrors = {};
  const nickname = normalizeNickname(values.nickname);
  if (!nickname) errors.nickname = MSG.nicknameMissing;
  else if (nickname.length > MAX_NICKNAME) errors.nickname = MSG.nicknameLong;

  if (values.mode === "band") {
    if (!isAgeBand(values.band)) errors.age = MSG.bandMissing;
  } else if (!values.month || !values.year) {
    errors.age = MSG.monthMissing;
  } else {
    const age = monthsOld(Number(values.year), Number(values.month), now);
    if (age < 0 || age > MAX_AGE_MONTHS) errors.age = MSG.ageRange;
  }
  return errors;
}

/** The one age source the form is set to: a birth month or a band, never both. */
function ageSource(values: FormValues): { birthMonthYear: string } | { ageBand: (typeof AGE_BANDS)[number] } {
  return values.mode === "birth"
    ? { birthMonthYear: `${values.year}-${values.month.padStart(2, "0")}` }
    : { ageBand: values.band as (typeof AGE_BANDS)[number] };
}

export const toCreateInput = (values: FormValues): CreateChildInput => ({
  nickname: normalizeNickname(values.nickname),
  ...ageSource(values)
});

/** Only what changed; null when nothing did. */
export function toUpdateInput(values: FormValues, child: Child): UpdateChildInput | null {
  const nickname = normalizeNickname(values.nickname);
  const age = ageSource(values);
  const sameAge =
    "birthMonthYear" in age ? age.birthMonthYear === child.birthMonthYear : !child.birthMonthYear && age.ageBand === child.ageBand;
  const input: UpdateChildInput = {
    ...(nickname === child.nickname ? {} : { nickname }),
    ...(sameAge ? {} : age)
  };
  return Object.keys(input).length ? input : null;
}

/** True when the form's age source differs from what is stored. */
export function ageChanged(values: FormValues, child: Child): boolean {
  const diff = toUpdateInput(values, child);
  return !!diff && ("birthMonthYear" in diff || "ageBand" in diff);
}

/** On edit the age is checked only if it changed, so a child can be renamed even when the stored age is old. */
export function validateForm(values: FormValues, child?: Child, now = new Date()): FieldErrors {
  const { age, ...rest } = validate(values, now);
  return !child || ageChanged(values, child) ? { ...rest, ...(age ? { age } : {}) } : rest;
}

export type Prepared = { errors: FieldErrors } | { input: CreateChildInput & UpdateChildInput | null };

/** What submitting does: show errors, send this input, or (null) send nothing because nothing changed. */
export function prepareSubmit(values: FormValues, child?: Child, now = new Date()): Prepared {
  const errors = validateForm(values, child, now);
  if (errors.nickname || errors.age) return { errors };
  return { input: (child ? toUpdateInput(values, child) : toCreateInput(values)) as CreateChildInput & UpdateChildInput | null };
}

/** The stored birth month sits outside the year list, so it can be shown but not picked again. */
export const birthOutOfRange = (child: Child | undefined, now = new Date()) =>
  !!child?.birthMonthYear && !yearOptions(now).includes(child.birthMonthYear.slice(0, 4));

/** Turns a failed save into messages for the fields (400/422 details) or the whole form. */
export function mapApiError(error: unknown): FieldErrors {
  if (error instanceof UnauthorizedError) return { form: MSG.signedOut };
  if (!(error instanceof ApiError)) return { form: MSG.notSaved };
  if (error.status === 404) return { form: MSG.notFound };
  if (error.status !== 400 && error.status !== 422) return { form: MSG.notSaved };

  const errors: FieldErrors = {};
  for (const { field } of error.details) {
    if (field === "nickname") errors.nickname = MSG.nicknameMissing;
    else if (field === "birthMonthYear" || field === "ageBand") errors.age = error.status === 422 ? MSG.ageRange : MSG.generic;
  }
  // No usable field detail: say it once for the form.
  return errors.nickname || errors.age ? errors : { form: error.status === 422 ? MSG.ageRange : MSG.generic };
}

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/**
 * Current year and the five before it: the last six years (UI/UX spec §2.2).
 * Because years run back only five, the oldest months (70 and 71 months old) cannot be picked; this matches the spec.
 */
export const yearOptions = (now = new Date()) =>
  Array.from({ length: 6 }, (_, i) => String(now.getUTCFullYear() - i));

export const bandOptions = AGE_BANDS.map((band) => ({ value: band, label: ageBandLabel(band) }));
