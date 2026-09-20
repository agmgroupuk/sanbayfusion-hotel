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
} from "drizzle-orm/pg-core";

export const reservationStatus = pgEnum("reservation_status", [
  "pending",
  "confirmed",
  "cancelled",
]);

export const membershipRequestStatus = pgEnum("membership_request_status", [
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
]);

export const membershipInvoiceStatus = pgEnum("membership_invoice_status", [
  "awaiting_payment",
  "paid",
  "payment_expired",
  "cancelled_by_admin",
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
    membershipNumber: varchar("membership_number", { length: 40 }),
    membershipStartDate: date("membership_start_date"),
    membershipExpiryDate: date("membership_expiry_date"),
    finalMembershipSnapshot: jsonb("final_membership_snapshot"),
    cancellationRequestedAt: timestamp("cancellation_requested_at", { withTimezone: true }),
    notes: text("notes"),
    allergies: text("allergies"),
    status: membershipRequestStatus("status").notNull().default("pending_review"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("membership_requests_status_idx").on(t.status), index("membership_requests_email_idx").on(t.email)],
);

export type Reservation = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;
export type MembershipRequest = typeof membershipRequests.$inferSelect;
export type NewMembershipRequest = typeof membershipRequests.$inferInsert;
