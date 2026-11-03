import { describe, expect, it } from "vitest";
import { ApiError, UnauthorizedError } from "../../services/api";
import { FALLBACK_CATALOG_ACTIVITIES } from "../catalog";
import { localDate, matchesFilters, problemFor, validatePlanDate } from "./logic";

const byId = (id: string) => FALLBACK_CATALOG_ACTIVITIES.find((a) => a.id === id)!;

describe("today logic", () => {
  it("formats the local date as YYYY-MM-DD", () => {
    expect(localDate(new Date(2026, 10, 5))).toBe("2026-11-05");
  });

  it("validates dates like the API", () => {
    expect(validatePlanDate("2026-11-05")).toBeUndefined();
    expect(validatePlanDate("")).toBe("Choose a date.");
    expect(validatePlanDate("11/05/2026")).toBeTruthy();
    expect(validatePlanDate("2026-02-30")).toBe("Enter a real date.");
  });

  it("applies quick filters together", () => {
    const tummy = byId("act-tummy-mirror"); // indoor, 10 min, has materials
    expect(matchesFilters(tummy, [])).toBe(true);
    expect(matchesFilters({ ...tummy, durationMinutes: 9 }, ["under10", "indoor"])).toBe(true);
    expect(matchesFilters(tummy, ["under10"])).toBe(false); // exactly 10 is not under 10
    expect(matchesFilters(tummy, ["noMaterials"])).toBe(false);
    expect(matchesFilters({ ...tummy, setting: "outdoor" }, ["indoor"])).toBe(false);
    expect(matchesFilters(undefined, ["indoor"])).toBe(false);
  });

  it("words failures without claiming a save", () => {
    expect(problemFor(new ApiError(404, "RESOURCE_NOT_FOUND", "x"), "marked complete").kind).toBe("gone");
    expect(problemFor(new UnauthorizedError(), "marked complete").kind).toBe("unauthorized");
    expect(problemFor(new TypeError("fetch failed"), "marked complete").message).toContain("wasn't marked complete");
  });
});
