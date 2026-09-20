import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

export const emailConfigured = Boolean(apiKey);

export const resend = apiKey ? new Resend(apiKey) : null;

export const FROM_EMAIL =
  process.env.RESERVATION_FROM_EMAIL || "Sanbay Fusion Bar & Restaurant <onboarding@resend.dev>";

export const STAFF_EMAIL = process.env.RESTAURANT_NOTIFY_EMAIL || "";
