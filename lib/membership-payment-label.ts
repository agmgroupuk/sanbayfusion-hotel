export function membershipPaymentLabel(row: { invoiceStatus?: string | null; stripeInvoiceStatus?: string | null; paymentFailure?: string | null; applicationState?: string | null }) {
  if (row.invoiceStatus === "paid") return "PAID";
  if (row.paymentFailure && row.stripeInvoiceStatus === "paid") return "PAYMENT REQUIRES STAFF REVIEW";
  if (row.applicationState === "pending_review" && row.stripeInvoiceStatus === "draft") return "NOT YET CHARGED";
  return "NOT PAID";
}
