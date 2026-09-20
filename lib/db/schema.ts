import {
  pgTable,
  uuid,
  varchar,
  integer,
  date,
  timestamp,
  text,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

export const reservationStatus = pgEnum("reservation_status", [
  "pending",
  "confirmed",
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

export type Reservation = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;
