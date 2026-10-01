import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";

export type MembershipPaymentReviewEmailData = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  requestNumber: string;
  planName: string;
  purchaseMode: string;
  membershipFee: number;
  packageSubtotal: number;
  totalPaid: number;
  durationMonths: number;
  paymentReference: string;
};

const money = (value: number) => `THB ${value.toLocaleString("en-US")}`;

export function MembershipPaymentReviewEmail(data: MembershipPaymentReviewEmailData) {
  return <Html><Head /><Preview>Paid membership awaiting final review · {data.requestNumber}</Preview><Body style={{ backgroundColor: "#faf8f3", margin: 0, fontFamily: "Georgia, serif" }}><Container style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 32px" }}><Text style={{ color: "#b08d39", letterSpacing: "0.2em", textTransform: "uppercase", fontSize: "11px" }}>Sanbay Fusion Memberships</Text><Heading style={{ color: "#17150f", fontSize: "28px", fontWeight: 400 }}>Payment received · review required</Heading><Text style={{ color: "#6b6457", fontSize: "15px", lineHeight: "1.6" }}>A membership purchase has been paid and is waiting for authorized staff approval. No Member ID has been issued and the membership is not active.</Text><Text style={{ color: "#17150f", fontSize: "15px", lineHeight: "1.8" }}>Reference: <strong>{data.requestNumber}</strong><br />Customer: {data.customerName}<br />Email: {data.customerEmail}<br />Phone: {data.customerPhone}<br />Plan: {data.planName}<br />Purchase mode: {data.purchaseMode}<br />Membership fee: {money(data.membershipFee)}<br />Prepaid package: {money(data.packageSubtotal)}<br />Total paid: {money(data.totalPaid)}<br />Membership duration: {data.durationMonths} months from final activation<br />Stripe payment reference: {data.paymentReference}</Text><Text style={{ color: "#6b6457", fontSize: "14px", lineHeight: "1.6" }}>Review the saved customer details and commercial agreement in the Sanbay Fusion staff membership review page.</Text></Container></Body></Html>;
}
