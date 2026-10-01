import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { membershipRequests, type MembershipRequest } from "@/lib/db/schema";
import { membershipHasExpired } from "@/lib/membership-term";

export async function resolveMembershipStatus<T extends MembershipRequest | null | undefined>(membership: T): Promise<T> {
  if (membership?.status !== "active" || !membershipHasExpired(membership)) return membership;
  if (db) await db.update(membershipRequests).set({ status: "expired" }).where(and(eq(membershipRequests.id, membership.id), eq(membershipRequests.status, "active")));
  return { ...membership, status: "expired" } as T;
}
