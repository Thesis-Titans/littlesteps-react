import { describe, expect, it } from "vitest";
import { ApiError, UnauthorizedError } from "./api";
import { failureKind } from "./offline";

describe("failureKind", () => {
  it("is offline only when the browser is offline, whatever the error", () => {
    const errors = [new TypeError("Failed to fetch"), new ApiError(500, "X", "m"), new Error("x")];
    for (const e of errors) {
      expect(failureKind(e, false)).toBe("offline");
      expect(failureKind(e, true)).toBe("error");
    }
  });
  it("treats a rejected session as unauthorized either way", () => {
    expect(failureKind(new UnauthorizedError(), true)).toBe("unauthorized");
    expect(failureKind(new UnauthorizedError(), false)).toBe("unauthorized");
  });
});
