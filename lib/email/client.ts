import { Resend } from "resend";
import { emailSender } from "./senders";

const apiKey = process.env.RESEND_API_KEY;

export const emailConfigured = Boolean(apiKey);

export const resend = apiKey ? new Resend(apiKey) : null;

export const ACCOUNT_FROM_EMAIL = emailSender("account");
export const SUPPORT_FROM_EMAIL = emailSender("support");
export const RESERVATION_FROM_EMAIL = emailSender("reservation");
/** Legacy membership callers use Support. */
export const FROM_EMAIL = SUPPORT_FROM_EMAIL;

export const STAFF_EMAIL = process.env.RESTAURANT_NOTIFY_EMAIL || "";
