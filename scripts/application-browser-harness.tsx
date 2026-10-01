import React from "react";
import { createRoot } from "react-dom/client";
import { MembershipCheckoutForm } from "../components/membership/membership-checkout-form";
import { MembershipPaymentRecovery } from "../components/membership/membership-payment-recovery";
declare global { interface Window { mountApplication: (props: React.ComponentProps<typeof MembershipCheckoutForm>) => void; mountRecovery: (props: React.ComponentProps<typeof MembershipPaymentRecovery>) => void } }
const root = createRoot(document.getElementById("root")!);
window.mountApplication = props => root.render(<MembershipCheckoutForm {...props} />);
window.mountRecovery = props => root.render(<MembershipPaymentRecovery {...props} />);
