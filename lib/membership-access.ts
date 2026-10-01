import "server-only";
import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { customerAccounts, membershipRequests, type CustomerAccount, type MembershipRequest } from "@/lib/db/schema";
import { hasActiveMembership, hasOngoingMembership, membershipHasExpired } from "@/lib/membership-term";
import { ApplicationError } from "@/lib/membership-errors";

type Database = NonNullable<typeof db>;
export type MembershipTransaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
type Reader = Pick<Database, "select">;

export function membershipOwner(accountId: string, stripeCustomerId: string | null) {
  const direct = eq(membershipRequests.customerAccountId, accountId);
  return stripeCustomerId ? or(direct, and(isNull(membershipRequests.customerAccountId), eq(membershipRequests.stripeCustomerId, stripeCustomerId)))! : direct;
}

export async function membershipsForAccount(account: Pick<CustomerAccount, "id" | "stripeCustomerId">, database: Reader = db!) {
  if (!database) throw new ApplicationError("Membership services are unavailable.", 503);
  return database.select().from(membershipRequests).where(membershipOwner(account.id, account.stripeCustomerId)).orderBy(desc(membershipRequests.createdAt));
}

export async function activeMembershipForAccount(account: CustomerAccount) {
  return (await membershipsForAccount(account)).find(row => hasActiveMembership(row)) ?? null;
}

export async function accountHasOngoingMembership(account: CustomerAccount | null) {
  return account ? (await membershipsForAccount(account)).some(row => hasOngoingMembership(row)) : false;
}

/** Lock the same owner before any draft, submission, charge or activation mutation. */
export async function lockMembershipAccount(tx: MembershipTransaction, accountId: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${accountId}, 0))`);
  const [account] = await tx.select().from(customerAccounts).where(eq(customerAccounts.id, accountId)).limit(1).for("update");
  if (!account) throw new ApplicationError("Please sign in again.", 401);
  return account;
}

export async function lockMembershipApplication(tx: MembershipTransaction, id: string, accountId?: string) {
  const [initial] = await tx.select().from(membershipRequests).where(eq(membershipRequests.id, id)).limit(1);
  if (!initial || (accountId && initial.customerAccountId !== accountId)) throw new ApplicationError("Application not found.", 404);
  let ownerId = initial.customerAccountId;
  if (!ownerId && initial.stripeCustomerId) {
    const mapped = await tx.select({ id: customerAccounts.id }).from(customerAccounts).where(eq(customerAccounts.stripeCustomerId, initial.stripeCustomerId)).limit(2);
    if (mapped.length > 1) throw new ApplicationError("The historical payment account mapping needs review.", 409);
    ownerId = mapped[0]?.id ?? null;
  }
  const account = ownerId ? await lockMembershipAccount(tx, ownerId) : null;
  const [row] = await tx.select().from(membershipRequests).where(eq(membershipRequests.id, id)).limit(1).for("update");
  if (!row || row.customerAccountId !== initial.customerAccountId) throw new ApplicationError("Application ownership changed. Please retry.", 409);
  return { row, account };
}

export async function assertMembershipPurchaseAllowed(tx: MembershipTransaction, account: CustomerAccount, exceptId?: string) {
  const rows = await membershipsForAccount(account, tx);
  const other = rows.filter(row => row.id !== exceptId);
  if (other.some(row => hasOngoingMembership(row))) throw new ApplicationError("Your Sanbay Fusion membership is already active or scheduled. You cannot purchase another membership until your current membership has ended. View your Customer Dashboard.", 409);
  const closed = new Set<MembershipRequest["status"]>(["application_draft", "expired", "cancelled", "declined", "rejected"]);
  if (other.some(row => !closed.has(row.status) && !(["active", "cancellation_requested"].includes(row.status) && membershipHasExpired(row)))) throw new ApplicationError("You already have a submitted application or membership. Check your dashboard.", 409);
}
