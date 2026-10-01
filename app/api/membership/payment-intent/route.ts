import { membershipHasExpired } from "@/lib/membership-term";
import { hashPurchaseSnapshot } from "@/lib/membership-snapshot-hash";
import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getCurrentAccount } from "@/lib/auth";
import { db } from "@/lib/db";
import { customerAccounts, membershipRequests, stripeMembershipCatalog, type MembershipRequest } from "@/lib/db/schema";
import { isBangkokProvince } from "@/lib/delivery";
import { geocodeGoogleAddress } from "@/lib/google-geocoding";
import { membershipPlans } from "@/lib/membership-plans";
import { readMembershipCheckoutSelection } from "@/lib/membership-checkout";
import { validateMembershipConfiguration } from "@/lib/membership-request";
import { stripe } from "@/lib/stripe";

const addressSchema = z.object({
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional().default(""),
  subdistrict: z.string().trim().min(1).max(120),
  district: z.string().trim().min(1).max(120),
  province: z.string().trim().min(2).max(120),
  postalCode: z.string().trim().min(3).max(20),
  country: z.literal("Thailand"),
});

const checkoutInputSchema = z.object({
  customer: z.object({ fullName: z.string().trim().min(2).max(120), phone: z.string().trim().min(6).max(40) }),
  billingAddress: addressSchema,
  deliveryAddress: addressSchema.partial().optional(),
  sameAsBilling: z.boolean(),
  savePaymentMethod: z.boolean().default(false),
});

export async function POST(request: Request) {
  const account = await getCurrentAccount();
  if (!account) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const selection = await readMembershipCheckoutSelection();
  if (!selection) {
    return NextResponse.json({ error: "No membership plan has been selected." }, { status: 400 });
  }

  const plan = membershipPlans.find((item) => item.slug === selection.planSlug);
  if (!plan) {
    return NextResponse.json({ error: "Membership plan not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsedInput = checkoutInputSchema.safeParse(body);
  if (!parsedInput.success) return NextResponse.json({ error: "Complete your customer and Thailand address details before payment." }, { status: 400 });
  const input = parsedInput.data;
  const deliveryAddress = input.sameAsBilling ? input.billingAddress : addressSchema.safeParse(input.deliveryAddress).data;
  if (!deliveryAddress) return NextResponse.json({ error: "Complete your delivery address before payment." }, { status: 400 });
  let verifiedProvince = deliveryAddress.province;
  if (process.env.GOOGLE_MAPS_SERVER_API_KEY) {
    try {
      const address = [deliveryAddress.line1, deliveryAddress.line2, deliveryAddress.subdistrict, deliveryAddress.district, deliveryAddress.province, deliveryAddress.postalCode, deliveryAddress.country].filter(Boolean).join(", ");
      const geocoded = await geocodeGoogleAddress({ address });
      if (!geocoded.ok) return NextResponse.json({ error: "We couldn't verify the delivery address. Check it and try again." }, { status: 400 });
      verifiedProvince = geocoded.place.province ?? "";
    } catch (error) {
      console.error("[membership payment-intent] Delivery address verification failed", error);
      return NextResponse.json({ error: "Delivery address verification is temporarily unavailable. Please try again." }, { status: 503 });
    }
  }
  if (!isBangkokProvince(verifiedProvince)) {
    return NextResponse.json({ error: "Membership delivery is currently available only within Bangkok." }, { status: 400 });
  }

  if (selection.configuration.planSlug !== plan.slug) return NextResponse.json({ error: "Membership selection does not match the configuration." }, { status: 400 });
  const checked = validateMembershipConfiguration(selection.configuration);
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });
  const { total, membershipFee, packageSubtotal, purchaseSnapshot } = checked;
  const snapshotHash = hashPurchaseSnapshot(purchaseSnapshot);

  if (!db) {
    console.error("[membership payment-intent] Database is not configured: missing DATABASE_URL.");
    return NextResponse.json({ error: "Membership checkout is unavailable because the account database is not configured." }, { status: 503 });
  }
  if (!stripe) {
    console.error("[membership payment-intent] Stripe Sandbox is not configured: expected an sk_test_ secret key.");
    return NextResponse.json({ error: "Stripe Sandbox credentials are not configured for this environment. Add STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY before checkout can run." }, { status: 503 });
  }

  try {
    let catalog = null as typeof stripeMembershipCatalog.$inferSelect | null;
    try {
      catalog = (await db.select().from(stripeMembershipCatalog).where(eq(stripeMembershipCatalog.planId, plan.id)).limit(1))[0] ?? null;
    } catch (error) {
      console.error("[membership payment-intent] Catalog table unavailable; resolving Stripe Sandbox metadata", error);
    }
    if (!catalog) {
      const products = await stripe.products.search({ query: `metadata['sanbay_plan_id']:'${plan.id}'` });
      const product = products.data[0];
      if (product) {
        const prices = await stripe.prices.list({ product: product.id, active: true, limit: 100 });
        const price = prices.data.find((candidate) => candidate.type === "one_time" && candidate.currency === "thb" && candidate.unit_amount === plan.price * 100);
        if (price) catalog = { planId: plan.id, planSlug: plan.slug, productId: product.id, priceId: price.id, amount: price.unit_amount ?? 0, currency: price.currency, mode: "test", updatedAt: new Date() };
      }
    }
    if (!catalog || catalog.amount !== plan.price * 100 || catalog.currency !== "thb" || catalog.mode !== "test") {
      return NextResponse.json({ error: "This membership plan is not configured for Stripe Sandbox yet." }, { status: 503 });
    }

    const payments = stripe;
    return await db.transaction(async (tx) => {
      // Serialize draft creation/renewal per account. Row locks also coordinate
      // with webhook recording, so paid commercial snapshots cannot be replaced.
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${account.id}, 0))`);
    const storedAccount = (await tx.select().from(customerAccounts).where(eq(customerAccounts.id, account.id)).limit(1))[0];
    let stripeCustomerId = storedAccount?.stripeCustomerId ?? null;
    if (!stripeCustomerId) {
      const customer = await payments.customers.create({
        email: account.email,
        name: account.fullName ?? undefined,
        metadata: { sanbayAccountId: account.id, accountType: "customer" },
      });
      stripeCustomerId = customer.id;
      await tx.update(customerAccounts).set({ stripeCustomerId, updatedAt: new Date() }).where(eq(customerAccounts.id, account.id));
    }

    let membership: MembershipRequest | undefined = (await tx.select().from(membershipRequests).where(eq(membershipRequests.customerAccountId, account.id)).orderBy(desc(membershipRequests.createdAt)).limit(1).for("update"))[0];
    if (!membership) {
      membership = (await tx.select().from(membershipRequests).where(eq(membershipRequests.email, account.email)).orderBy(desc(membershipRequests.createdAt)).limit(1).for("update"))[0];
    }
    if (membership?.status === "active" && membershipHasExpired(membership)) {
      await tx.update(membershipRequests).set({ status: "expired" }).where(eq(membershipRequests.id, membership.id));
      membership = { ...membership, status: "expired" };
    }
    // Renewal creates a separate term and preserves the previous paid agreement.
    if (membership?.status === "expired" || membership?.status === "cancelled") membership = undefined;
    if (membership?.status === "active" || membership?.status === "payment_received" || membership?.invoiceStatus === "paid") {
      return NextResponse.json({ error: "A paid membership request already exists for this account. Check your dashboard for its status." }, { status: 409 });
    }
    const reusableLegacyDraft = membership?.status === "pending_review" && !membership.stripePaymentIntentId;
    if (membership?.status !== undefined && membership.status !== "payment_pending" && !reusableLegacyDraft) {
      return NextResponse.json({ error: "A membership request is already under review for this account." }, { status: 409 });
    }

    const previousIntentId = membership?.stripePaymentIntentId ?? "initial";
    if (membership?.stripePaymentIntentId) {
      const existingIntent = await payments.paymentIntents.retrieve(membership.stripePaymentIntentId);
      if (existingIntent.status === "succeeded" || existingIntent.status === "processing") {
        return NextResponse.json({ error: "Your payment is already processing. Please check your dashboard before retrying." }, { status: 409 });
      }
      if (existingIntent.status !== "canceled" && existingIntent.metadata.purchase_snapshot_hash === snapshotHash && existingIntent.amount === total * 100 && existingIntent.client_secret) {
        await tx.update(membershipRequests).set({ fullName: input.customer.fullName, phone: input.customer.phone, address: { billing: input.billingAddress, delivery: deliveryAddress, sameAsBilling: input.sameAsBilling } }).where(eq(membershipRequests.id, membership.id));
        await payments.paymentIntents.update(existingIntent.id, { setup_future_usage: input.savePaymentMethod ? "off_session" : "" });
        return NextResponse.json({
          purchaseSnapshot,
          clientSecret: existingIntent.client_secret,
          membershipRequestId: membership.id,
          requestNumber: membership.requestNumber,
          planSlug: plan.slug,
          stripeCustomerId,
          purchaseMode: purchaseSnapshot.purchaseMode,
          amount: total,
          membershipFee,
          packageSubtotal,
        });
      }
      if (existingIntent.status === "requires_payment_method" || existingIntent.status === "requires_confirmation" || existingIntent.status === "requires_action") {
        await payments.paymentIntents.cancel(existingIntent.id);
      }
    }

    if (!membership) {
      const requestNumber = `M-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const inserted = await tx.insert(membershipRequests).values({
        customerAccountId: account.id,
        requestNumber,
        planId: plan.id,
        planName: plan.name,
        planSnapshot: { slug: plan.slug, name: plan.name, price: plan.price, description: plan.description, durationMonths: plan.durationMonths },
        annualFee: membershipFee,
        addOnTotal: packageSubtotal,
        estimatedTotal: total,
        durationMonths: plan.durationMonths,
        deliveryDays: 0,
        annualDeliveryDays: 0,
        fullName: input.customer.fullName,
        phone: input.customer.phone,
        email: account.email,
        address: { billing: input.billingAddress, delivery: deliveryAddress, sameAsBilling: input.sameAsBilling },
        contactPreferences: { email: true, sms: true },
        configuration: selection.configuration,
        purchaseSnapshot,
        status: "payment_pending",
        invoiceStatus: "awaiting_payment",
        stripeCustomerId,
        stripeInvoiceId: null,
        stripePaymentIntentId: null,
        memberId: null,
        membershipNumber: null,
        membershipStartDate: null,
        membershipExpiryDate: null,
        finalMembershipSnapshot: null,
        notes: null,
        allergies: null,
      }).returning();
      membership = inserted[0];
    }

    await tx.update(customerAccounts).set({ fullName: input.customer.fullName, phone: input.customer.phone, updatedAt: new Date() }).where(eq(customerAccounts.id, account.id));
    await tx.update(membershipRequests).set({
      customerAccountId: account.id,
      planId: plan.id,
      planName: plan.name,
      planSnapshot: { slug: plan.slug, name: plan.name, price: plan.price, description: plan.description, durationMonths: plan.durationMonths },
      annualFee: membershipFee,
      addOnTotal: packageSubtotal,
      estimatedTotal: total,
      durationMonths: plan.durationMonths,
      deliveryDays: 0,
      annualDeliveryDays: 0,
      fullName: input.customer.fullName,
      phone: input.customer.phone,
      address: { billing: input.billingAddress, delivery: deliveryAddress, sameAsBilling: input.sameAsBilling },
      configuration: selection.configuration,
      purchaseSnapshot,
      status: "payment_pending",
      invoiceStatus: "awaiting_payment",
      stripeCustomerId,
      stripePaymentIntentId: null,
    }).where(eq(membershipRequests.id, membership.id));

    const paymentIntent = await payments.paymentIntents.create({
      amount: total * 100,
      currency: "thb",
      customer: stripeCustomerId,
      setup_future_usage: input.savePaymentMethod ? "off_session" : undefined,
      automatic_payment_methods: { enabled: true },
      metadata: {
        payment_type: "MEMBERSHIP_PURCHASE",
        purchase_mode: purchaseSnapshot.purchaseMode === "membership_only" ? "MEMBERSHIP_ONLY" : "MEMBERSHIP_WITH_PACKAGE",
        user_id: account.id,
        membership_id: String(membership.id),
        plan_id: plan.id,
        purchase_snapshot_hash: snapshotHash,
      },
      description: `${plan.name} membership purchase`,
    }, { idempotencyKey: `membership-${membership.id}-${snapshotHash}-${previousIntentId}` });

    await tx.update(membershipRequests).set({ stripePaymentIntentId: paymentIntent.id }).where(eq(membershipRequests.id, membership.id));

    return NextResponse.json({
      purchaseSnapshot,
      clientSecret: paymentIntent.client_secret,
      membershipRequestId: membership.id,
      requestNumber: membership.requestNumber,
      planSlug: plan.slug,
      stripeCustomerId,
      purchaseMode: purchaseSnapshot.purchaseMode,
      amount: total,
      membershipFee,
      packageSubtotal,
    });
    });
  } catch (error) {
    console.error("[membership payment-intent] Failed to create Stripe PaymentIntent", error);
    return NextResponse.json({ error: "Unable to prepare payment. Please retry or contact the team." }, { status: 500 });
  }
}
