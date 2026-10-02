import { z } from "zod";

export const passwordMaxLength = 200;
/** Shared by browser feedback and every server-side new-password entry point. Never trim a password. */
export const passwordRequirements = [
  { id: "length", label: "At least 10 characters", test: (value: string) => Array.from(value).length >= 10 },
  { id: "uppercase", label: "One uppercase letter (A–Z)", test: (value: string) => /[A-Z]/.test(value) },
  { id: "lowercase", label: "One lowercase letter (a–z)", test: (value: string) => /[a-z]/.test(value) },
  { id: "number", label: "One number (0–9)", test: (value: string) => /[0-9]/.test(value) },
  { id: "symbol", label: "One special character or symbol", test: (value: string) => /[\p{P}\p{S}]/u.test(value) },
  { id: "whitespace", label: "No leading or trailing whitespace", test: (value: string) => value.length > 0 && value === value.trim() },
] as const;

export function passwordChecks(password: string) {
  return passwordRequirements.map(rule => ({ id: rule.id, label: rule.label, met: rule.test(password) }));
}
export const passwordSchema = z.string().max(passwordMaxLength, `Use no more than ${passwordMaxLength} characters`).superRefine((value, context) => {
  for (const rule of passwordRequirements) if (!rule.test(value)) context.addIssue({ code: "custom", message: rule.label });
});
export const passwordConfirmationSchema = z.object({ password: passwordSchema, confirmation: z.string() }).refine(
  value => value.password === value.confirmation, { path: ["confirmation"], message: "Passwords do not match." },
);
