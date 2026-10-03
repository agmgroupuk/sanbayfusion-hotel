import { describe, expect, it } from "vitest";
import { membershipPlanBlockState, preferredMembershipPlanBlockState } from "./membership-plan-state";
import type { MembershipRequest } from "./db/schema";

function request(
  status: MembershipRequest["status"],
  membershipExpiryDate: string | null = null,
) {
  return {
    status,
    membershipExpiryDate,
    selectedServiceMonths: null,
    purchaseSnapshot: null,
    durationMonths: 3,
  };
}

describe("plan-specific membership blocking state", () => {
  it("blocks under-review, verified, payment-pending, and other live application statuses", () => {
    for (const status of [
      "pending_review",
      "contacting_customer",
      "verified",
      "approved",
      "approved_payment_pending",
      "approved_payment_action_required",
      "approved_payment_failed",
      "changes_requested",
      "invoice_issued",
      "awaiting_payment",
      "payment_pending",
      "payment_received",
      "membership_setup",
    ] as const) {
      expect(membershipPlanBlockState(request(status))).not.toBeNull();
    }
  });

  it("blocks current active memberships but not expired or closed history", () => {
    expect(membershipPlanBlockState(request("active", "2099-12-31"))).toBe("active");
    expect(membershipPlanBlockState(request("cancellation_requested", "2099-12-31"))).toBe("active");
    for (const status of ["application_draft", "expired", "cancelled", "declined", "rejected"] as const) {
      expect(membershipPlanBlockState(request(status))).toBeNull();
    }
    expect(membershipPlanBlockState(request("active", "2020-01-01"))).toBeNull();
  });

  it("prefers an active state when historical records contain multiple plan states", () => {
    expect(preferredMembershipPlanBlockState(["under_review", "in_progress", "active"])).toBe("active");
    expect(preferredMembershipPlanBlockState([null, "under_review"])).toBe("under_review");
    expect(preferredMembershipPlanBlockState([null])).toBeNull();
  });
});
