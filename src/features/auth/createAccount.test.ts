import { FirebaseError } from "firebase/app";
import { describe, expect, it } from "vitest";
import { describeCreateAccountError, validateCreateAccount } from "./createAccount";

const ok = { email: "a@b.co", password: "12345678", acceptedPrivacy: true };

describe("validateCreateAccount", () => {
  it("accepts valid input, including a pasted password with spaces", () => {
    expect(validateCreateAccount(ok)).toEqual({});
    expect(validateCreateAccount({ ...ok, password: "  a b c d  " })).toEqual({});
  });
  it("reports each problem on its field", () => {
    const errors = validateCreateAccount({ email: "nope", password: "short", acceptedPrivacy: false });
    expect(Object.keys(errors).sort()).toEqual(["email", "password", "privacy"]);
  });
  it("trims the email before checking", () => {
    expect(validateCreateAccount({ ...ok, email: " a@b.co " })).toEqual({});
  });
});

describe("describeCreateAccountError", () => {
  const code = (c: string) => describeCreateAccountError(new FirebaseError(c, "x"));
  it("maps field errors", () => {
    expect(code("auth/email-already-in-use").email).toBeDefined();
    expect(code("auth/invalid-email").email).toBeDefined();
    expect(code("auth/weak-password").password).toBeDefined();
  });
  it("maps network and unknown errors to form-level messages", () => {
    expect(code("auth/network-request-failed").form).toContain("connection");
    expect(code("auth/internal-error").form).toBeDefined();
    expect(describeCreateAccountError(new Error("boom")).form).toBeDefined();
  });
  it("does not leak the raw Firebase message", () => {
    expect(JSON.stringify(code("auth/email-already-in-use"))).not.toContain("auth/");
  });
});
