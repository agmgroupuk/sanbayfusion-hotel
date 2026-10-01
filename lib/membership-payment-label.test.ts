import { expect, it } from "vitest";
import { membershipPaymentLabel } from "./membership-payment-label";
it("distinguishes actual authorized payment from an invoice marked paid without matching proof", () => {
  expect(membershipPaymentLabel({ invoiceStatus: "awaiting_payment", stripeInvoiceStatus: "paid", paymentFailure: "No matching card payment" })).toBe("PAYMENT REQUIRES STAFF REVIEW");
  expect(membershipPaymentLabel({ invoiceStatus: "paid", stripeInvoiceStatus: "paid" })).toBe("PAID");
  expect(membershipPaymentLabel({ invoiceStatus: "awaiting_payment", stripeInvoiceStatus: "draft", applicationState: "pending_review" })).toBe("NOT YET CHARGED");
});
