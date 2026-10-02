import { z } from "zod";

/** Shared public notice, declaration and server validation for this membership program. */
export const membershipEligibilityVersion = "international-visitors-2026-10-02";
export const membershipEligibilityNotice = "Sanbay Fusion Membership is designed exclusively for eligible foreign visitors who normally live outside Thailand and travel to Thailand temporarily. This membership program is not available to domestic Thai customers.";
export const membershipEligibilityConfirmation = "I confirm that I am a foreign visitor who normally lives outside Thailand and is travelling to Thailand temporarily for tourism, a holiday, a business trip, an extended visit or a similar purpose. I meet the membership eligibility requirements and understand that my application is subject to review and approval.";
export const membershipEligibilityError = "This membership is only available to eligible foreign visitors who normally live outside Thailand and visit temporarily. Confirm your eligibility before submitting.";
export const membershipEligibilityInput = z.object({
  confirmInternationalVisitor: z.literal(true),
  eligibilityVersion: z.literal(membershipEligibilityVersion),
});
const declarationSchema = z.object({
  version: z.literal(membershipEligibilityVersion),
  confirmed: z.literal(true),
  statement: z.literal(membershipEligibilityConfirmation),
  acceptedAt: z.string().datetime(),
});
export type MembershipEligibilityDeclaration = z.infer<typeof declarationSchema>;
export function membershipEligibilityDeclaration(acceptedAt: Date): MembershipEligibilityDeclaration {
  return { version: membershipEligibilityVersion, confirmed: true, statement: membershipEligibilityConfirmation, acceptedAt: acceptedAt.toISOString() };
}
export function hasMembershipEligibilityDeclaration(value: unknown): value is MembershipEligibilityDeclaration {
  return declarationSchema.safeParse(value).success;
}
