import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ db: null }));
vi.mock("@/lib/stripe", () => ({ stripe: null }));
import { submitInvoiceApplication } from "@/lib/membership-invoice";
import { submitApplication } from "@/lib/membership-application";
import { submitApplicationSchema, applicationConsentVersion } from "@/lib/membership-application-types";
import { membershipEligibilityVersion, membershipEligibilityDeclaration, hasMembershipEligibilityDeclaration } from "@/lib/membership-eligibility";
import type { CustomerAccount } from "@/lib/db/schema";

const input = {
  applicationId: "7a198e0b-4a1e-4d01-8b24-80f471fa8bc1", quoteHash: "a".repeat(64),
  authorizeCharge: true, acceptTerms: true, acceptPrivacy: true, consentVersion: applicationConsentVersion,
  confirmInternationalVisitor: true, eligibilityVersion: membershipEligibilityVersion,
};
describe("international visitor membership eligibility", () => {
  it.each([false, undefined, null, "true", 1])("rejects a missing or non-boolean declaration: %s", async value => {
    const body = { ...input, confirmInternationalVisitor: value };
    expect(submitApplicationSchema.safeParse(body).success).toBe(false);
    // Rejection must happen before accessing a database or payment provider.
    for (const submit of [submitInvoiceApplication, submitApplication]) {
      await expect(submit({ id: "account-a" } as CustomerAccount, body)).rejects.toThrow("eligible foreign visitors");
    }
  });
  it.each([undefined, "old-policy", ""])("rejects absent or obsolete policy versions: %s", version => {
    expect(submitApplicationSchema.safeParse({ ...input, eligibilityVersion: version }).success).toBe(false);
  });
  it("accepts the current explicit declaration with the existing payment agreements", () => {
    expect(submitApplicationSchema.safeParse(input).success).toBe(true);
    expect(submitApplicationSchema.safeParse({ ...input, authorizeCharge: false }).success).toBe(false);
  });
  it("retains the exact declaration and timestamp for staff review", () => {
    const saved = membershipEligibilityDeclaration(new Date("2026-10-02T09:00:00Z"));
    expect(saved.acceptedAt).toBe("2026-10-02T09:00:00.000Z");
    expect(hasMembershipEligibilityDeclaration(JSON.parse(JSON.stringify(saved)))).toBe(true);
    for (const value of [undefined, {}, { ...saved, confirmed: false }, { ...saved, statement: "I agree" }, { ...saved, acceptedAt: "invalid" }]) {
      expect(hasMembershipEligibilityDeclaration(value)).toBe(false);
    }
  });
});
