import type { SafeCard } from "@/lib/account/types";
import type { ApplicationDetails } from "@/lib/membership-application-types";
export type AccountRequirement = { label: string; complete: boolean; section: "personal" | "addresses" | "payment-methods" };
export type MembershipAccountReview = {
  customer: { fullName: string; email: string; phone: string };
  billingAddress: ApplicationDetails["billingAddress"] | null;
  deliveryAddress: ApplicationDetails["deliveryAddress"] | null;
  cards: SafeCard[]; requirements: AccountRequirement[]; complete: boolean;
};
