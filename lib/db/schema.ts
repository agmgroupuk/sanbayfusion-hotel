import {
  pgTable,
  uuid,
  varchar,
  integer,
  date,
  timestamp,
  text,
  pgEnum,
  jsonb,
  index,
  uniqueIndex,
  boolean,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const customerAccounts = pgTable(
  "customer_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fullName: varchar("full_name", { length: 120 }),
    displayName: varchar("display_name", { length: 80 }),
    email: varchar("email", { length: 200 }).notNull(),
    phone: varchar("phone", { length: 40 }),
    stripeCustomerId: varchar("stripe_customer_id", { length: 120 }),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("customer_accounts_email_idx").on(t.email)],
);

export const accountAddresses = pgTable("account_addresses", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id").notNull().references(() => customerAccounts.id, { onDelete: "cascade" }),
  kind: varchar("kind", { length: 12 }).notNull(),
  details: jsonb("details").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [index("account_addresses_owner_idx").on(t.accountId), uniqueIndex("account_addresses_default_idx").on(t.accountId, t.kind).where(sql`${t.isDefault} = true`)]);

export const accountSecurity = pgTable("account_security", {
  accountId: uuid("account_id").primaryKey().references(() => customerAccounts.id, { onDelete: "cascade" }),
  totpSecret: text("totp_secret"),
  enabledAt: timestamp("enabled_at", { withTimezone: true }),
  pendingSecret: text("pending_secret"),
  pendingExpiresAt: timestamp("pending_expires_at", { withTimezone: true }),
  lastCounter: integer("last_counter").notNull().default(-1),
  recoveryHashes: jsonb("recovery_hashes").$type<string[]>().notNull().default([]),
});
export const accountEmailChanges = pgTable("account_email_changes", {
  accountId: uuid("account_id").primaryKey().references(() => customerAccounts.id, { onDelete: "cascade" }),
  newEmail: varchar("new_email", { length: 200 }).notNull(),
  tokenHash: varchar("token_hash", { length: 64 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
export const accountRateLimits = pgTable("account_rate_limits", {
  key: varchar("key", { length: 128 }).primaryKey(),
  attempts: integer("attempts").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
export const accountAuditEvents = pgTable("account_audit_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id").notNull().references(() => customerAccounts.id, { onDelete: "cascade" }),
  event: varchar("event", { length: 80 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [index("account_audit_owner_idx").on(t.accountId)]);

export const stripeMembershipCatalog = pgTable(
  "stripe_membership_catalog",
  {
    planId: varchar("plan_id", { length: 40 }).primaryKey(),
    planSlug: varchar("plan_slug", { length: 80 }).notNull().unique(),
    productId: varchar("product_id", { length: 120 }).notNull(),
    priceId: varchar("price_id", { length: 120 }).notNull(),
    amount: integer("amount").notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("thb"),
    mode: varchar("mode", { length: 12 }).notNull().default("test"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
);

export const customerSessions = pgTable(
  "customer_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id").notNull().references(() => customerAccounts.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 128 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("customer_sessions_token_hash_idx").on(t.tokenHash), index("customer_sessions_account_idx").on(t.accountId)],
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id").notNull().references(() => customerAccounts.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 128 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("password_reset_tokens_hash_idx").on(t.tokenHash), index("password_reset_tokens_account_idx").on(t.accountId)],
);

export const reservationStatus = pgEnum("reservation_status", [
  "pending",
  "confirmed",
  "cancelled",
]);

export const membershipRequestStatus = pgEnum("membership_request_status", [
  "application_draft",
  "pending_review",
  "approved_payment_pending",
  "approved_payment_action_required",
  "approved_payment_failed",
  "declined",
  "contacting_customer",
  "verified",
  "approved",
  "changes_requested",
  "invoice_issued",
  "awaiting_payment",
  "payment_pending",
  "payment_received",
  "membership_setup",
  "active",
  "expired",
  "cancellation_requested",
  "cancelled",
  "rejected",
]);

export const membershipInvoiceStatus = pgEnum("membership_invoice_status", [
  "awaiting_payment",
  "paid",
  "payment_expired",
  "cancelled_by_admin",
]);

export const customerOrderStatus = pgEnum("customer_order_status", [
  "pending_payment",
  "confirmed",
  "cancelled",
]);

export const customerPaymentStatus = pgEnum("customer_payment_status", [
  "pending",
  "paid",
  "failed",
  "refunded",
]);

export const membershipDeliveryStatus = pgEnum("membership_delivery_status", [
  "available",
  "scheduled",
  "fulfilled",
  "cancelled",
]);

export const reservations = pgTable(
  "reservations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 200 }).notNull(),
    phone: varchar("phone", { length: 40 }).notNull(),
    partySize: integer("party_size").notNull(),
    /** Local calendar date, YYYY-MM-DD. */
    date: date("date").notNull(),
    /** Service time, "HH:mm". */
    timeSlot: varchar("time_slot", { length: 5 }).notNull(),
    status: reservationStatus("status").notNull().default("pending"),
    specialRequests: text("special_requests"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("reservations_date_slot_idx").on(t.date, t.timeSlot)],
);

export const membershipRequests = pgTable(
  "membership_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerAccountId: uuid("customer_account_id").references(() => customerAccounts.id, { onDelete: "set null" }),
    requestNumber: varchar("request_number", { length: 32 }).notNull().unique(),
    planId: varchar("plan_id", { length: 40 }).notNull(),
    planName: varchar("plan_name", { length: 120 }).notNull(),
    planSnapshot: jsonb("plan_snapshot").notNull(),
    annualFee: integer("annual_fee").notNull(),
    addOnTotal: integer("add_on_total").notNull().default(0),
    estimatedTotal: integer("estimated_total").notNull(),
    // Existing SQL column is retained to preserve all historical durations.
    durationMonths: integer("validity_months").notNull(),
    // Null preserves historical consecutive-term agreements without inventing months.
    selectedServiceMonths: jsonb("selected_service_months").$type<string[]>(),
    // Historical delivery entitlements only; new duration plans store zero.
    deliveryDays: integer("delivery_days").notNull(),
    annualDeliveryDays: integer("annual_delivery_days").notNull(),
    fullName: varchar("full_name", { length: 120 }).notNull(),
    phone: varchar("phone", { length: 40 }).notNull(),
    email: varchar("email", { length: 200 }).notNull(),
    lineId: varchar("line_id", { length: 80 }),
    address: jsonb("address").notNull(),
    contactPreferences: jsonb("contact_preferences").notNull(),
    configuration: jsonb("configuration").notNull(),
    purchaseSnapshot: jsonb("purchase_snapshot"),
    applicationSnapshot: jsonb("application_snapshot"),
    stripeSetupIntentId: varchar("stripe_setup_intent_id", { length: 120 }),
    stripePaymentMethodId: varchar("stripe_payment_method_id", { length: 120 }),
    paymentMethodSummary: jsonb("payment_method_summary"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    reviewedBy: varchar("reviewed_by", { length: 200 }),
    paymentAttempt: integer("payment_attempt").notNull().default(0),
    paymentFailure: text("payment_failure"),
    invoiceNumber: varchar("invoice_number", { length: 40 }),
    invoiceIssuedAt: timestamp("invoice_issued_at", { withTimezone: true }),
    paymentDueAt: timestamp("payment_due_at", { withTimezone: true }),
    invoiceStatus: membershipInvoiceStatus("invoice_status"),
    stripeCustomerId: varchar("stripe_customer_id", { length: 120 }),
    stripeInvoiceId: varchar("stripe_invoice_id", { length: 120 }),
    stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 120 }),
    memberId: varchar("member_id", { length: 40 }),
    membershipNumber: varchar("membership_number", { length: 40 }),
    membershipStartDate: date("membership_start_date"),
    membershipExpiryDate: date("membership_expiry_date"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    activatedAt: timestamp("activated_at", { withTimezone: true }),
    activatedBy: varchar("activated_by", { length: 120 }),
    activationMethod: varchar("activation_method", { length: 40 }),
    finalMembershipSnapshot: jsonb("final_membership_snapshot"),
    cancellationRequestedAt: timestamp("cancellation_requested_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    notes: text("notes"),
    allergies: text("allergies"),
    status: membershipRequestStatus("status").notNull().default("pending_review"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("membership_requests_status_idx").on(t.status), index("membership_requests_email_idx").on(t.email)],
);

export const customerOrders = pgTable(
  "customer_orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderNumber: varchar("order_number", { length: 32 }).notNull().unique(),
    accountId: uuid("account_id").notNull().references(() => customerAccounts.id, { onDelete: "restrict" }),
    membershipRequestId: uuid("membership_request_id").notNull().references(() => membershipRequests.id, { onDelete: "restrict" }),
    subtotal: integer("subtotal").notNull(),
    total: integer("total").notNull(),
    notes: text("notes"),
    deliveryDetails: jsonb("delivery_details").notNull(),
    status: customerOrderStatus("status").notNull().default("pending_payment"),
    paymentStatus: customerPaymentStatus("payment_status").notNull().default("pending"),
    stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 120 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
  },
  (t) => [index("customer_orders_account_idx").on(t.accountId), index("customer_orders_membership_idx").on(t.membershipRequestId), index("customer_orders_payment_intent_idx").on(t.stripePaymentIntentId)],
);

export const membershipDeliveryEntitlements = pgTable(
  "membership_delivery_entitlements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    membershipRequestId: uuid("membership_request_id").notNull().references(() => membershipRequests.id, { onDelete: "cascade" }),
    cycleStartDate: date("cycle_start_date").notNull(),
    cycleEndDate: date("cycle_end_date").notNull(),
    sequence: integer("sequence").notNull(),
    scheduledDate: date("scheduled_date"),
    status: membershipDeliveryStatus("status").notNull().default("available"),
    packageSnapshot: jsonb("package_snapshot").notNull(),
    fulfilledAt: timestamp("fulfilled_at", { withTimezone: true }),
    fulfilledBy: varchar("fulfilled_by", { length: 120 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("membership_delivery_entitlement_slot_idx").on(t.membershipRequestId, t.cycleStartDate, t.sequence),
    index("membership_delivery_entitlement_schedule_idx").on(t.status, t.scheduledDate),
  ],
);

export const customerOrderItems = pgTable(
  "customer_order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id").notNull().references(() => customerOrders.id, { onDelete: "cascade" }),
    productName: varchar("product_name", { length: 200 }).notNull(),
    categoryName: varchar("category_name", { length: 120 }).notNull(),
    unitPrice: integer("unit_price").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotal: integer("line_total").notNull(),
  },
  (t) => [index("customer_order_items_order_idx").on(t.orderId)],
);

/** Included benefit reservations never create a paid order or Stripe charge. */
export const membershipBenefitRedemptions = pgTable("membership_benefit_redemptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  membershipRequestId: uuid("membership_request_id").notNull().references(() => membershipRequests.id, { onDelete: "restrict" }),
  serviceMonth: varchar("service_month", { length: 7 }).notNull(),
  mealName: varchar("meal_name", { length: 120 }).notNull(),
  menuValue: integer("menu_value").notNull(),
  scheduledDate: date("scheduled_date").notNull(),
  status: varchar("status", { length: 16 }).notNull().default("requested"),
  redeemedAt: timestamp("redeemed_at", { withTimezone: true }).notNull().defaultNow(),
  fulfilledAt: timestamp("fulfilled_at", { withTimezone: true }),
  fulfilledBy: varchar("fulfilled_by", { length: 200 }),
}, t => [
  uniqueIndex("membership_benefit_month_idx").on(t.membershipRequestId, t.serviceMonth),
  check("membership_benefit_valid_month", sql`${t.serviceMonth} ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'`),
  check("membership_benefit_in_month", sql`to_char(${t.scheduledDate}, 'YYYY-MM') = ${t.serviceMonth}`),
  check("membership_benefit_valid_status", sql`${t.status} in ('requested', 'fulfilled')`),
  check("membership_benefit_positive_value", sql`${t.menuValue} > 0`),
]);

export type Reservation = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;
export type CustomerAccount = typeof customerAccounts.$inferSelect;
export type MembershipRequest = typeof membershipRequests.$inferSelect;
export type NewMembershipRequest = typeof membershipRequests.$inferInsert;
export type CustomerOrder = typeof customerOrders.$inferSelect;
export type CustomerOrderItem = typeof customerOrderItems.$inferSelect;
export type MembershipDeliveryEntitlement = typeof membershipDeliveryEntitlements.$inferSelect;
export type MembershipBenefitRedemption = typeof membershipBenefitRedemptions.$inferSelect;
