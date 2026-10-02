import { describe, expect, it } from "vitest";
import { passwordChecks, passwordConfirmationSchema, passwordSchema } from "./password-policy";
import { signUpSchema } from "./signup-validation";
import { estimatePasswordStrength } from "./password-strength";

export const invalidPasswords = [
  ["empty", ""], ["short", "Aa1!short"], ["uppercase", "lowercase123!"], ["lowercase", "UPPERCASE123!"],
  ["number", "NoNumbersHere!"], ["symbol", "NoSymbolsHere123"], ["leading space", " GoodPassword123!"],
  ["trailing space", "GoodPassword123! "], ["trailing newline", "GoodPassword123!\n"],
  ["whitespace is not a symbol", "Has Internal Space123"], ["non-ASCII letters are not symbols", "GoodPassword123ก"],
  ["too long", "Ab1!" + "x".repeat(197)],
] as const;

describe("authoritative new-password policy", () => {
  it.each(invalidPasswords)("rejects %s", (_, password) => {
    expect(passwordSchema.safeParse(password).success).toBe(false);
    expect(passwordConfirmationSchema.safeParse({ password, confirmation: password }).success).toBe(false);
  });
  it("accepts required symbols, internal spaces and the existing 200-character ceiling", () => {
    for (const password of ["GoodPassword123!", "Good Password123!", "GoodPassword123€", "Ab1!" + "x".repeat(196)]) {
      expect(passwordSchema.safeParse(password).success).toBe(true);
      expect(passwordChecks(password).every(rule => rule.met)).toBe(true);
    }
  });
  it("does not silently trim either password and requires exact confirmation", () => {
    expect(passwordConfirmationSchema.safeParse({ password: "GoodPassword123!", confirmation: "GoodPassword123! " }).success).toBe(false);
    expect(passwordConfirmationSchema.safeParse({ password: "GoodPassword123!", confirmation: "" }).success).toBe(false);
  });
  it("requires every registration field and terms acceptance as well as the password pair", () => {
    const valid = { fullName: "Customer Name", email: "customer@example.invalid", phone: "+66 81 234 5678", password: "GoodPassword123!", confirmation: "GoodPassword123!", agreements: true };
    expect(signUpSchema.safeParse(valid).success).toBe(true);
    for (const fields of [{ fullName: " " }, { email: "invalid" }, { phone: "invalid" }, { agreements: false }, { confirmation: "wrong" }]) expect(signUpSchema.safeParse({ ...valid, ...fields }).success).toBe(false);
  });
  it("scores predictable patterns below an unpredictable password despite meeting the character rules", async () => {
    const predictable = await estimatePasswordStrength("Password123!");
    const repeated = await estimatePasswordStrength("Ab1!Ab1!Ab1!Ab1!Ab1!");
    const strong = await estimatePasswordStrength("v9&Kq2!Nz7@Tr4#Lx8");
    expect(predictable.score).toBeLessThan(strong.score);
    expect(repeated.score).toBeLessThan(strong.score);
    expect(strong.score).toBeGreaterThanOrEqual(3);
  });
});
