import type { MembershipRequest } from "@/lib/db/schema";
import { membershipHasExpired } from "@/lib/membership-term";

export type MembershipPlanBlockState = "under_review" | "active" | "in_progress";

export function membershipPlanBlockLabel(state: MembershipPlanBlockState) {
  if (state === "active") return "ACTIVE MEMBERSHIP";
  if (state === "under_review") return "UNDER REVIEW";
  return "APPLICATION IN PROGRESS";
}

export function membershipPlanBlockMessage(state: MembershipPlanBlockState) {
  if (state === "active") return "This membership plan is already active on your account.";
  if (state === "under_review") return "You already have an application in progress for this membership plan.";
  return "This membership plan already has an application in progress.";
}

const terminalStatuses = new Set<MembershipRequest["status"]>([
  "application_draft",
  "expired",
  "cancelled",
  "declined",
  "rejected",
]);

export function membershipPlanBlockState(
  request: Pick<MembershipRequest, "status" | "membershipExpiryDate" | "selectedServiceMonths" | "purchaseSnapshot" | "durationMonths">,
): MembershipPlanBlockState | null {
  if (terminalStatuses.has(request.status)) return null;
  if (
    ["active", "cancellation_requested"].includes(request.status) &&
    membershipHasExpired(request)
  ) return null;
  if (request.status === "active" || request.status === "cancellation_requested") return "active";
  if (request.status === "pending_review") return "under_review";
  return "in_progress";
}

export function preferredMembershipPlanBlockState(
  states: Array<MembershipPlanBlockState | null>,
): MembershipPlanBlockState | null {
  return states.find((state) => state === "active")
    ?? states.find((state) => state === "under_review")
    ?? states.find((state) => state === "in_progress")
    ?? null;
}
