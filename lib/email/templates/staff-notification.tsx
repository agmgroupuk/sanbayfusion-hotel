import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReservationEmailData } from "./guest-confirmation";

export function StaffNotificationEmail({
  name,
  email,
  phone,
  partySize,
  dateLong,
  timeSlot,
  specialRequests,
  reference,
}: ReservationEmailData) {
  return (
    <Html>
      <Head />
      <Preview>{`New booking — ${name}, party of ${partySize}, ${dateLong} ${timeSlot}`}</Preview>
      <Body style={{ backgroundColor: "#f4f4f5", margin: 0, fontFamily: "Arial, sans-serif" }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "32px" }}>
          <Heading style={{ fontSize: "20px", margin: "0 0 16px" }}>
            New reservation request
          </Heading>
          <Section style={{ backgroundColor: "#fff", borderRadius: "6px", padding: "20px", fontSize: "14px", lineHeight: "1.7" }}>
            <Text style={{ margin: 0 }}><strong>Name:</strong> {name}</Text>
            <Text style={{ margin: 0 }}><strong>Party:</strong> {partySize}</Text>
            <Text style={{ margin: 0 }}><strong>Date:</strong> {dateLong}</Text>
            <Text style={{ margin: 0 }}><strong>Time:</strong> {timeSlot}</Text>
            <Text style={{ margin: 0 }}><strong>Email:</strong> {email}</Text>
            <Text style={{ margin: 0 }}><strong>Phone:</strong> {phone}</Text>
            {reference ? <Text style={{ margin: 0 }}><strong>Ref:</strong> {reference}</Text> : null}
            {specialRequests ? (
              <Text style={{ margin: "8px 0 0" }}><strong>Notes:</strong> {specialRequests}</Text>
            ) : null}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
