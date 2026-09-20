import { describe, expect, it } from "vitest";
import { reservationSchema } from "./reservation";

const validInput = {
  name: "Alex Dupont",
  email: "alex@example.com",
  phone: "+33 1 23 45 67 89",
  partySize: 2,
  date: "2026-08-01",
  timeSlot: "19:00",
  specialRequests: "",
};

describe("reservationSchema", () => {
  it("accepts a well-formed reservation", () => {
    expect(reservationSchema.safeParse(validInput).success).toBe(true);
  });

  it("accepts an omitted specialRequests field", () => {
    const { name, email, phone, partySize, date, timeSlot } = validInput;
    expect(
      reservationSchema.safeParse({ name, email, phone, partySize, date, timeSlot })
        .success,
    ).toBe(true);
  });

  it("rejects a name that's too short", () => {
    const result = reservationSchema.safeParse({ ...validInput, name: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = reservationSchema.safeParse({
      ...validInput,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a party size over the configured max", () => {
    const result = reservationSchema.safeParse({
      ...validInput,
      partySize: 9,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/call us/i);
    }
  });

  it("rejects a party size under the configured min", () => {
    const result = reservationSchema.safeParse({
      ...validInput,
      partySize: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed date", () => {
    const result = reservationSchema.safeParse({
      ...validInput,
      date: "08/01/2026",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a time slot that isn't a real seating", () => {
    const result = reservationSchema.safeParse({
      ...validInput,
      timeSlot: "17:45",
    });
    expect(result.success).toBe(false);
  });

  it("rejects special requests over the character limit", () => {
    const result = reservationSchema.safeParse({
      ...validInput,
      specialRequests: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});
