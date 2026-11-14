/**
 * ISO 8601 week calculations and formatting for This Week reflection view.
 */

export const DOMAIN_LABELS: Record<string, string> = {
  cognitive: "Thinking",
  motor: "Moving",
  language: "Talking",
  socioEmotional: "Feelings",
};

export const DOMAIN_DESCRIPTIONS: Record<string, string> = {
  cognitive: "Exploring, problem solving, and curiosity",
  motor: "Physical movement, coordination, and gestures",
  language: "Sounds, words, and everyday communication",
  socioEmotional: "Social connection, emotions, and bonding",
};

/**
 * Returns the ISO week boundaries (Monday–Sunday inclusive, UTC) for a given ISO week string.
 * @param isoWeek e.g. "2026-W46"
 */
export function isoWeekBounds(isoWeek: string): { weekStart: string; weekEnd: string } {
  const [yearStr, weekStr] = isoWeek.split("-W");
  const year = Number(yearStr);
  const week = Number(weekStr);

  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Dow = jan4.getUTCDay() || 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - (jan4Dow - 1));

  const monday = new Date(week1Monday);
  monday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  return {
    weekStart: monday.toISOString().slice(0, 10),
    weekEnd: sunday.toISOString().slice(0, 10),
  };
}

/**
 * Returns the ISO week string (e.g. "2026-W46") for the week containing a given date.
 */
export function currentIsoWeek(now = new Date()): string {
  const thursday = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dow = thursday.getUTCDay() || 7;
  thursday.setUTCDate(thursday.getUTCDate() + (4 - dow));

  const isoYear = thursday.getUTCFullYear();

  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const jan4Dow = jan4.getUTCDay() || 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - (jan4Dow - 1));

  const diffMs = thursday.getTime() - week1Monday.getTime();
  const week = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;

  return `${isoYear}-W${String(week).padStart(2, "0")}`;
}

/**
 * Shifts an ISO week by +/- deltaWeeks.
 */
export function shiftIsoWeek(isoWeek: string, deltaWeeks: number): string {
  const { weekStart } = isoWeekBounds(isoWeek);
  const [y, m, d] = weekStart.split("-").map(Number);
  const monday = new Date(Date.UTC(y, m - 1, d + deltaWeeks * 7));
  return currentIsoWeek(monday);
}

/**
 * Formats a Monday-Sunday range for human reading, e.g. "Nov 2 – Nov 8, 2026".
 */
export function formatWeekRange(startDate: string, endDate: string): string {
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const [ey, em, ed] = endDate.split("-").map(Number);

  const start = new Date(Date.UTC(sy, sm - 1, sd));
  const end = new Date(Date.UTC(ey, em - 1, ed));

  const startMonth = start.toLocaleDateString("en", { month: "short", timeZone: "UTC" });
  const endMonth = end.toLocaleDateString("en", { month: "short", timeZone: "UTC" });
  const startDay = start.getUTCDate();
  const endDay = end.getUTCDate();
  const year = end.getUTCFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} – ${endDay}, ${year}`;
  }
  return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${year}`;
}
