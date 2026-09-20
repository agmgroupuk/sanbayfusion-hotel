import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.string().trim().email("Enter a valid email").max(200),
  phone: z
    .string()
    .trim()
    .max(40, "Please keep your number under 40 characters")
    .optional()
    .or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(10, "Please add a little more detail")
    .max(2000, "Please keep your message under 2000 characters"),
});

export type ContactInput = z.infer<typeof contactSchema>;
