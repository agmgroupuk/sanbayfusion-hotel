from pathlib import Path
root=Path(__file__).resolve().parents[1]
def read(p): return (root/p).read_text(encoding='utf-8')
def write(p,s): (root/p).write_text(s,encoding='utf-8')
p='app/api/membership/payment-intent/route.ts';s=read(p)
s=s.replace('import { resolveMembershipStatus } from "@/lib/membership-status";', 'import { membershipHasExpired } from "@/lib/membership-term";\nimport { hashPurchaseSnapshot } from "@/lib/membership-snapshot-hash";')
s=s.replace('import { createHash } from "node:crypto";\n','').replace('import { desc, eq }','import { desc, eq, sql }')
s=s.replace('customerAccounts, membershipRequests, stripeMembershipCatalog','customerAccounts, membershipRequests, stripeMembershipCatalog, type MembershipRequest')
s=s.replace('createHash("sha256").update(JSON.stringify(purchaseSnapshot)).digest("hex")','hashPurchaseSnapshot(purchaseSnapshot)')
start=s.index('    let stripeCustomerId =')
end=s.index('  } catch (error) {\n    console.error("[membership payment-intent] Failed',start)
block=s[start:end]
block=block.replace('await db.', 'await tx.')
block=block.replace('let membership =','let membership: MembershipRequest | undefined =')
block=block.replace('.limit(1))[0]', '.limit(1).for("update"))[0]')
block=block.replace('membership = await resolveMembershipStatus(membership);','''if (membership?.status === "active" && membershipHasExpired(membership)) {
      await tx.update(membershipRequests).set({ status: "expired" }).where(eq(membershipRequests.id, membership.id));
      membership = { ...membership, status: "expired" };
    }''')
block=block.replace('membership = undefined as unknown as typeof membership;', 'membership = undefined;')
block=block.replace('    if (membership?.stripePaymentIntentId) {', '    const previousIntentId = membership?.stripePaymentIntentId ?? "initial";\n    if (membership?.stripePaymentIntentId) {')
block=block.replace('if (existingIntent.metadata.purchase_snapshot_hash === snapshotHash', 'if (existingIntent.status !== "canceled" && existingIntent.metadata.purchase_snapshot_hash === snapshotHash')
block=block.replace('        return NextResponse.json({\n          clientSecret: existingIntent.client_secret,', '''        await tx.update(membershipRequests).set({ fullName: input.customer.fullName, phone: input.customer.phone, address: { billing: input.billingAddress, delivery: deliveryAddress, sameAsBilling: input.sameAsBilling } }).where(eq(membershipRequests.id, membership.id));
        await stripe.paymentIntents.update(existingIntent.id, { setup_future_usage: input.savePaymentMethod ? "off_session" : "" });
        return NextResponse.json({
          purchaseSnapshot,
          clientSecret: existingIntent.client_secret,''')
block=block.replace('`membership-${membership.id}-${snapshotHash}`', '`membership-${membership.id}-${snapshotHash}-${previousIntentId}`')
block=block.replace('      clientSecret: paymentIntent.client_secret,','      purchaseSnapshot,\n      clientSecret: paymentIntent.client_secret,')
block=block.replace('await stripe.', 'await payments.')
block=block.replace('let stripeCustomerId = account.stripeCustomerId ?? null;', '''const storedAccount = (await tx.select().from(customerAccounts).where(eq(customerAccounts.id, account.id)).limit(1))[0];
    let stripeCustomerId = storedAccount?.stripeCustomerId ?? null;''')
s=s[:start]+'''    const payments = stripe;
    return await db.transaction(async (tx) => {
      // Serialize draft creation/renewal per account. Row locks also coordinate
      // with webhook recording, so paid commercial snapshots cannot be replaced.
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${account.id}, 0))`);
'''+block+'    });\n'+s[end:]
s=s.replace('    const message = error instanceof Error ? error.message : "Unknown Stripe error";\n    return NextResponse.json({ error: `Unable to create a payment intent: ${message}` }, { status: 500 });','    return NextResponse.json({ error: "Unable to prepare payment. Please retry or contact the team." }, { status: 500 });')
write(p,s)

p='lib/membership-activation.ts';s=read(p)
s=s.replace('import { parseISO }', 'import { hashPurchaseSnapshot } from "@/lib/membership-snapshot-hash";\nimport { parseISO }')
s=s.replace('  purchaseMode,\n}: {','  purchaseMode,\n  snapshotHash,\n}: {').replace('  purchaseMode: string;\n})', '  purchaseMode: string;\n  snapshotHash?: string;\n})')
start=s.index('  const membership = (await db.select()',s.index('export async function recordMembershipPayment'))
end=s.index('  if (row) {',start)
s=s[:start]+'''  let notifyStaff = false;
  const row = await db.transaction(async tx => {
    const membership = (await tx.select().from(membershipRequests).where(eq(membershipRequests.id, id)).limit(1).for("update"))[0];
    if (!membership || membership.stripeCustomerId !== stripeCustomerId || amount !== membership.estimatedTotal * 100) return null;
    const snapshot = membership.purchaseSnapshot as { version?: number; purchaseMode?: string } | null;
    const expectedMode = snapshot?.purchaseMode === "membership_with_package" ? "MEMBERSHIP_WITH_PACKAGE" : "MEMBERSHIP_ONLY";
    if (purchaseMode !== expectedMode) return null;
    if (snapshot?.version === 3 && (membership.stripePaymentIntentId !== paymentIntentId || snapshotHash !== hashPurchaseSnapshot(snapshot))) return null;
    if (membership.invoiceStatus === "paid") return membership.stripePaymentIntentId === paymentIntentId ? membership : null;
    if (membership.status !== "payment_pending") return null;
    const [paid] = await tx.update(membershipRequests)
      .set({ status: "payment_received", invoiceStatus: "paid", stripePaymentIntentId: paymentIntentId })
      .where(and(eq(membershipRequests.id, id), eq(membershipRequests.status, "payment_pending")))
      .returning();
    notifyStaff = !!paid;
    return paid ?? null;
  });
'''+s[end:]
s=s.replace('  if (row) {\n    const purchase', '  if (row && notifyStaff) {\n    const purchase')
s=s.replace('if (membership.status !== "payment_received") return null;', 'if (membership.status !== "payment_received" || membership.invoiceStatus !== "paid") return null;')
s=s.replace('if (membership.status === "active") return membership;', 'if (membership.status === "active") return membership;')
s=s.replace('  await db.insert(membershipDeliveryEntitlements).values(schedule).onConflictDoNothing();','  if (schedule.length) await db.insert(membershipDeliveryEntitlements).values(schedule).onConflictDoNothing();')
write(p,s)
for p,var in [('app/api/stripe/webhook/route.ts','paymentIntent'),('app/(site)/membership/thank-you/page.tsx','intent')]:
    s=read(p).replace(f'purchaseMode: {var}.metadata.purchase_mode ?? "",',f'purchaseMode: {var}.metadata.purchase_mode ?? "",\n    snapshotHash: {var}.metadata.purchase_snapshot_hash,')
    write(p,s)

# Refresh the displayed quote with the actual server-validated payment snapshot.
p='components/membership/membership-checkout-form.tsx';s=read(p)
s=s.replace('export function MembershipCheckoutForm({ plan, account, purchaseSnapshot, publishableKey }','export function MembershipCheckoutForm({ plan, account, purchaseSnapshot: initialSnapshot, publishableKey }')
s=s.replace('  const stripePromise = useMemo(', '  const [purchaseSnapshot, setPurchaseSnapshot] = useState(initialSnapshot);\n  const stripePromise = useMemo(')
s=s.replace('    setClientSecret(payload.clientSecret);','    setPurchaseSnapshot(payload.purchaseSnapshot);\n    setClientSecret(payload.clientSecret);')
write(p,s)
