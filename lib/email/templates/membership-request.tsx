import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";

export type MembershipRequestEmailData = {
  name: string;
  email: string;
  requestNumber: string;
  planName: string;
  deliveryDays: number;
  estimatedTotal: number;
};

export function MembershipRequestEmail({ name, requestNumber, planName, deliveryDays, estimatedTotal }: MembershipRequestEmailData) {
  return <Html><Head /><Preview>We received your Sanbay Fusion membership request</Preview><Body style={{ backgroundColor: "#faf8f3", margin: 0, fontFamily: "Georgia, serif" }}><Container style={{ maxWidth: "560px", margin: "0 auto", padding: "40px 32px" }}><Text style={{ color: "#b08d39", letterSpacing: "0.25em", textTransform: "uppercase", fontSize: "11px" }}>Sanbay Fusion Memberships</Text><Heading style={{ color: "#17150f", fontSize: "30px", fontWeight: 400 }}>Request received</Heading><Text style={{ color: "#6b6457", fontSize: "16px", lineHeight: "1.6" }}>Hello {name}, thank you for submitting your Sanbay Fusion membership request. Our team will review it and contact you within approximately 3 days.</Text><Text style={{ color: "#17150f", fontSize: "16px", lineHeight: "1.8" }}>Request: <strong>{requestNumber}</strong><br />Membership: {planName}<br />Delivery: {deliveryDays} days per month<br />Estimated value: ฿{estimatedTotal.toLocaleString("en-US")}<br />Status: Pending review</Text><Text style={{ color: "#6b6457", fontSize: "14px", lineHeight: "1.6" }}>This request does not activate a membership or take payment.</Text></Container></Body></Html>;
}
