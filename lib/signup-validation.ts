import { z } from "zod";
import { passwordConfirmationSchema } from "./password-policy";

/** Browser and server agree on all required registration fields, including terms acceptance. */
export const signUpSchema = passwordConfirmationSchema.safeExtend({
  fullName: z.string().trim().min(2, "Enter your full name").max(120, "Use no more than 120 characters for your name"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(200),
  phone: z.string().trim().regex(/^(?:\+66|0)[0-9\s().-]{8,18}$/, "Enter a valid Thailand mobile number"),
  agreements: z.boolean().refine(value => value, "Please accept the Terms & Conditions and Privacy Policy."),
});
