import { z } from "zod";
import { reservationConfig } from "@/lib/reservations/config";

export const reservationSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.string().trim().email("Enter a valid email").max(200),
  phone: z.string().trim().min(6, "Enter a contact number").max(40),
  partySize: z
    .number()
    .int()
    .min(reservationConfig.minPartySize, "Select a party size")
    .max(
      reservationConfig.maxPartySize,
      `For parties over ${reservationConfig.maxPartySize}, please call us`,
    ),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date"),
  timeSlot: z
    .string()
    .refine(
      (v) => (reservationConfig.serviceTimes as readonly string[]).includes(v),
      "Choose a time",
    ),
  specialRequests: z
    .string()
    .trim()
    .max(500, "Please keep requests under 500 characters")
    .optional()
    .or(z.literal("")),
});

export type ReservationInput = z.infer<typeof reservationSchema>;
