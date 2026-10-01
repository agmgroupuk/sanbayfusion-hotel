import React from "react";
import { createRoot } from "react-dom/client";
import { PaymentMethods } from "../components/account/account-forms";
import { MembershipReturn } from "../components/account/membership-return";
import { MembershipCheckoutForm } from "../components/membership/membership-checkout-form";
import { InvoicePaymentRecovery } from "../components/membership/invoice-payment-recovery";
const root = createRoot(document.getElementById("root")!);
declare global { interface Window {
  mountInvoiceCards: (props: React.ComponentProps<typeof PaymentMethods>) => void;
  mountInvoiceReview: (props: React.ComponentProps<typeof MembershipCheckoutForm>) => void;
  mountInvoiceAuth: (props: React.ComponentProps<typeof InvoicePaymentRecovery>) => void;
} }
window.mountInvoiceCards = props => root.render(<main className="mx-auto max-w-5xl p-6"><MembershipReturn /><PaymentMethods {...props} /></main>);
window.mountInvoiceReview = props => root.render(<main className="py-12"><MembershipCheckoutForm {...props} /></main>);
window.mountInvoiceAuth = props => root.render(<main className="mx-auto max-w-3xl p-6"><InvoicePaymentRecovery {...props} /></main>);
