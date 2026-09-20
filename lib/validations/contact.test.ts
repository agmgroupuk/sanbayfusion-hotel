import { describe, expect, it } from "vitest";
import { contactSchema } from "./contact";

const validInput = {
  name: "Alex Dupont",
  email: "alex@example.com",
  phone: "+33 1 23 45 67 89",
  message: "Could we book the private room for six guests next month?",
};

describe("contactSchema", () => {
  it("accepts a well-formed message", () => {
    expect(contactSchema.safeParse(validInput).success).toBe(true);
  });

  it("accepts a missing phone number", () => {
    const { name, email, message } = validInput;
    expect(contactSchema.safeParse({ name, email, message }).success).toBe(
      true,
    );
  });

  it("accepts an empty phone string", () => {
    expect(
      contactSchema.safeParse({ ...validInput, phone: "" }).success,
    ).toBe(true);
  });

  it("rejects a name that's too short", () => {
    expect(
      contactSchema.safeParse({ ...validInput, name: "A" }).success,
    ).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(
      contactSchema.safeParse({ ...validInput, email: "nope" }).success,
    ).toBe(false);
  });

  it("rejects a message that's too short", () => {
    expect(
      contactSchema.safeParse({ ...validInput, message: "Hi" }).success,
    ).toBe(false);
  });

  it("rejects a message over the character limit", () => {
    expect(
      contactSchema.safeParse({ ...validInput, message: "x".repeat(2001) })
        .success,
    ).toBe(false);
  });
});
