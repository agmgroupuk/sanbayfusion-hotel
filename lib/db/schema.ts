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
} from "drizzle-orm/pg-core";

export const customerAccounts = pgTable(
  "customer_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fullName: varchar("full_name", { length: 120 }),
    email: varchar("email", { length: 200 }).notNull(),
    phone: varchar("phone", { length: 40 }),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("customer_accounts_email_idx").on(t.email)],
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
  "pending_review",
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
    validityMonths: integer("validity_months").notNull(),
    deliveryDays: integer("delivery_days").notNull(),
    annualDeliveryDays: integer("annual_delivery_days").notNull(),
    fullName: varchar("full_name", { length: 120 }).notNull(),
    phone: varchar("phone", { length: 40 }).notNull(),
    email: varchar("email", { length: 200 }).notNull(),
    lineId: varchar("line_id", { length: 80 }),
    address: jsonb("address").notNull(),
    contactPreferences: jsonb("contact_preferences").notNull(),
    configuration: jsonb("configuration").notNull(),
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

export type Reservation = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;
export type CustomerAccount = typeof customerAccounts.$inferSelect;
export type MembershipRequest = typeof membershipRequests.$inferSelect;
export type NewMembershipRequest = typeof membershipRequests.$inferInsert;
export type CustomerOrder = typeof customerOrders.$inferSelect;
export type CustomerOrderItem = typeof customerOrderItems.$inferSelect;
