import { z } from "zod";
import { alcoholSalesEnabled, beverageAddOns, membershipPlans } from "@/lib/membership-plans";

export const membershipRequestStatuses = [
  "pending_review",
  "contacting_customer",
  "approved",
  "changes_requested",
  "invoice_issued",
  "awaiting_payment",
  "payment_received",
  "membership_setup",
  "active",
  "cancellation_requested",
  "rejected",
  "cancelled",
] as const;

export const membershipConfigurationSchema = z.object({
  planSlug: z.string().min(1),
  foodPreferences: z.array(z.string().min(1)).max(8),
  deliveryArea: z.string().min(1),
  preferredDay: z.string().min(1),
  preferredTime: z.string().min(1),
  alcoholEnabled: z.boolean(),
  selectedAddOns: z.array(z.object({
    category: z.string().min(1),
    name: z.string().min(1),
    quantity: z.number().int().min(0).max(5),
  })).max(7),
});

export const membershipApplicationSchema = z.object({
  configuration: membershipConfigurationSchema,
  fullName: z.string().trim().min(2, "Please enter your full name").max(120),
  phone: z.string().trim().min(6, "Please enter a mobile number").max(40),
  email: z.string().trim().email("Please enter a valid email").max(200),
  lineId: z.string().trim().max(80).optional().or(z.literal("")),
  addressLine1: z.string().trim().min(3, "Please enter your address").max(200),
  addressLine2: z.string().trim().max(200).optional().or(z.literal("")),
  subdistrict: z.string().trim().max(120).optional().or(z.literal("")),
  district: z.string().trim().max(120).optional().or(z.literal("")),
  province: z.string().trim().min(2, "Please enter your province").max(120),
  postalCode: z.string().trim().min(3, "Please enter a postal code").max(20),
  country: z.literal("Thailand"),
  deliveryInstructions: z.string().trim().max(1000).optional().or(z.literal("")),
  contactPreferences: z.array(z.enum(["phone", "email", "line", "whatsapp"])).min(1, "Choose at least one contact method"),
  notes: z.string().trim().max(1500).optional().or(z.literal("")),
  allergies: z.string().trim().max(1000).optional().or(z.literal("")),
  confirmsInformation: z.boolean().refine((value) => value === true, { message: "Please confirm your information is correct" }),
  reviewedMembership: z.boolean().refine((value) => value === true, { message: "Please confirm you reviewed your membership" }),
  understandsRequest: z.boolean().refine((value) => value === true, { message: "Please confirm this is a request, not activation" }),
  understandsInvoiceWindow: z.boolean().refine((value) => value === true, { message: "Please confirm the three-day invoice window" }),
  understandsNonRefundable: z.boolean().refine((value) => value === true, { message: "Please confirm the non-refundable membership rule" }),
  understandsPackageLock: z.boolean().refine((value) => value === true, { message: "Please confirm the package lock rule" }),
  understandsDeliveryNotice: z.boolean().refine((value) => value === true, { message: "Please confirm the three-day delivery notice" }),
  agreesTerms: z.boolean().refine((value) => value === true, { message: "Please agree to the Membership Terms & Conditions" }),
  acknowledgesPrivacy: z.boolean().refine((value) => value === true, { message: "Please acknowledge the Privacy Policy" }),
  agreesContact: z.boolean().refine((value) => value === true, { message: "Please agree to be contacted" }),
  confirmsAlcoholLaw: z.boolean(),
});

export type MembershipConfiguration = z.infer<typeof membershipConfigurationSchema>;
export type MembershipApplicationInput = z.infer<typeof membershipApplicationSchema>;

export type ValidatedMembershipApplication = MembershipApplicationInput & {
  plan: (typeof membershipPlans)[number];
  addOnTotal: number;
  total: number;
};

export function validateMembershipConfiguration(configuration: MembershipConfiguration) {
  const plan = membershipPlans.find((item) => item.slug === configuration.planSlug);
  if (!plan) return { ok: false as const, error: "That membership plan is not available." };
  if (configuration.alcoholEnabled && !alcoholSalesEnabled) {
    return { ok: false as const, error: "Alcohol options are not currently available." };
  }

  if (!configuration.foodPreferences.every((preference) => ["Thai Food", "Seafood", "Chicken", "Beef", "Pork", "Vegetarian", "Western Food", "Asian Food"].includes(preference))) {
    return { ok: false as const, error: "One or more food preferences are invalid." };
  }

  const allowed = new Map(beverageAddOns.map((addOn) => [addOn.category, addOn]));
  let addOnTotal = 0;
  for (const selected of configuration.selectedAddOns) {
    const addOn = allowed.get(selected.category);
    if (!addOn || !plan.allowedBeverageCategories.includes(selected.category) || !addOn.options.includes(selected.name as never)) {
      return { ok: false as const, error: "One or more beverage selections are not available for this plan." };
    }
    if (!configuration.alcoholEnabled || selected.quantity === 0) {
      return { ok: false as const, error: "Alcohol selections require the beverage option to be enabled." };
    }
    addOnTotal += addOn.price * selected.quantity;
  }

  if (configuration.alcoholEnabled && !configuration.selectedAddOns.length) {
    return { ok: false as const, error: "Choose a beverage add-on or turn alcohol options off." };
  }

  return { ok: true as const, plan, addOnTotal, total: plan.price + addOnTotal };
}
