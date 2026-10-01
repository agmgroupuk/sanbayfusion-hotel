import { z } from "zod";
import { billingCountryCodes } from "@/lib/billing-countries";
export const profileSchema = z.object({ fullName: z.string().trim().min(2).max(120), displayName: z.string().trim().max(80), phone: z.string().trim().regex(/^\+?[0-9][0-9\s().-]{5,38}$/, "Enter a valid phone number") });
export const passwordSchema = z.string().min(10, "Use at least 10 characters").max(200).regex(/[a-z]/, "Include a lowercase letter").regex(/[A-Z]/, "Include an uppercase letter").regex(/[0-9]/, "Include a number");
export const addressSchema = z.object({
  id: z.string().uuid().optional(), kind: z.enum(["billing", "delivery"]), isDefault: z.boolean().default(false),
  details: z.object({ name: z.string().trim().min(2).max(120), phone: z.string().trim().regex(/^\+?[0-9][0-9\s().-]{5,38}$/), country: z.string().refine(code => billingCountryCodes.has(code)), line1: z.string().trim().min(3).max(200), line2: z.string().trim().max(200).default(""), city: z.string().trim().max(120).default(""), state: z.string().trim().max(120).default(""), subdistrict: z.string().trim().max(120).default(""), district: z.string().trim().max(120).default(""), province: z.string().trim().max(120).default(""), postalCode: z.string().trim().max(20).default("") }),
}).superRefine(({ kind, details }, ctx) => {
  if (kind === "delivery" && (details.country !== "TH" || !details.subdistrict || !details.district || !details.province || !/^\d{5}$/.test(details.postalCode))) ctx.addIssue({ code: "custom", path: ["details"], message: "Enter a complete Thailand delivery address and five-digit postal code." });
  if (kind === "billing" && (!details.city || (["US", "GB", "CA", "TH", "AU", "DE", "FR", "JP"].includes(details.country) && !details.postalCode))) ctx.addIssue({ code: "custom", path: ["details"], message: "Enter the billing city and required postal code." });
});
export type AddressInput = z.infer<typeof addressSchema>;
export type SavedAddress = AddressInput & { id: string };
export type SafeCard = { id: string; brand: string; last4: string; expMonth: number; expYear: number; isDefault: boolean };
export class AccountError extends Error { constructor(message: string, public status = 400) { super(message); } }
