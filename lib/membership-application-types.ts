import { z } from "zod";
import { billingCountryCodes } from "@/lib/billing-countries";
import type { MembershipPurchaseSnapshot } from "@/lib/membership-request";
import { membershipEligibilityInput, type MembershipEligibilityDeclaration } from "@/lib/membership-eligibility";

export const applicationConsentVersion = "membership-approval-charge-2026-10-01";
export const chargeAuthorization = "I authorize Sanbay Fusion to charge the payment method I provided for the displayed membership/package amount if my membership application is approved.";
export const billingAddressSchema = z.object({
  country: z.string().refine(value => billingCountryCodes.has(value), "Choose a billing country"),
  line1: z.string().trim().min(3).max(200), line2: z.string().trim().max(200).default(""),
  city: z.string().trim().min(1).max(120), state: z.string().trim().max(120).default(""), postalCode: z.string().trim().max(20).default(""),
}).superRefine((value, ctx) => {
  if (["US", "CA", "GB", "TH", "AU", "DE", "FR", "JP"].includes(value.country) && !value.postalCode) ctx.addIssue({ code: "custom", path: ["postalCode"], message: "Postal code is required" });
});
export const deliveryAddressSchema = z.object({
  country: z.literal("Thailand"), line1: z.string().trim().min(3).max(200), line2: z.string().trim().max(200).default(""),
  subdistrict: z.string().trim().min(1).max(120), district: z.string().trim().min(1).max(120), province: z.string().trim().min(2).max(120), postalCode: z.string().regex(/^\d{5}$/, "Enter a five-digit Thailand postal code"),
});
export const applicationDetailsSchema = z.object({
  customer: z.object({ fullName: z.string().trim().min(2).max(120), phone: z.string().trim().regex(/^\+?[0-9][0-9\s().-]{5,38}$/) }),
  billingAddress: billingAddressSchema, deliveryAddress: deliveryAddressSchema,
});
export type ApplicationDetails = z.infer<typeof applicationDetailsSchema>;
export type PaymentMethodSummary = { brand: string; last4: string; expMonth: number; expYear: number };
export type ApplicationSnapshot = {
  membershipEligibility?: MembershipEligibilityDeclaration; // Absent on historical agreements.
  version: 1 | 2; reference: string; accountId: string; accountCreatedAt: string;
  customer: { fullName: string; email: string; phone: string };
  purchase: MembershipPurchaseSnapshot; expectedAmount: number; currency: "thb";
  billingAddress: ApplicationDetails["billingAddress"]; deliveryAddress: ApplicationDetails["deliveryAddress"];
  deliveryEligibility: { status: "available"; zoneId: string; checkedAt: string };
  stripeCustomerId: string; stripePaymentMethodId: string; paymentMethod: PaymentMethodSummary;
  submittedAt: string; consent: { version: string; acceptedAt: string; authorization: string; amount: number; currency: "thb"; terms: true; privacy: true; reference: string };
};
export const submitApplicationSchema = z.object({
  ...membershipEligibilityInput.shape,
  applicationId: z.string().uuid(), quoteHash: z.string().length(64),
  authorizeCharge: z.literal(true), acceptTerms: z.literal(true), acceptPrivacy: z.literal(true), consentVersion: z.literal(applicationConsentVersion),
});
