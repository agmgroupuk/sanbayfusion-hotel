import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface ReservationEmailData {
  name: string;
  email: string;
  phone: string;
  partySize: number;
  dateLong: string;
  timeSlot: string;
  specialRequests?: string;
  reference?: string;
}

const ink = "#17150f";
const paper = "#faf8f3";
const gold = "#b08d39";
const muted = "#6b6457";

export function GuestConfirmationEmail({
  name,
  partySize,
  dateLong,
  timeSlot,
  specialRequests,
  reference,
}: ReservationEmailData) {
  return (
    <Html>
      <Head />
      <Preview>{`Your table at Sanbay Fusion — ${dateLong} at ${timeSlot}`}</Preview>
      <Body style={{ backgroundColor: paper, margin: 0, fontFamily: "Georgia, 'Times New Roman', serif" }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "40px 32px" }}>
          <Text style={{ letterSpacing: "0.3em", textTransform: "uppercase", fontSize: "11px", color: gold, fontFamily: "Arial, sans-serif", margin: 0 }}>
            Sanbay Fusion Bar & Restaurant · City
          </Text>
          <Heading style={{ color: ink, fontSize: "30px", fontWeight: 400, margin: "16px 0 0" }}>
            Your table is requested
          </Heading>
          <Text style={{ color: muted, fontSize: "16px", lineHeight: "1.6" }}>
            Dear {name}, thank you for choosing Sanbay Fusion Bar & Restaurant. We have received your
            reservation request and will confirm shortly by email or phone.
          </Text>

          <Section style={{ backgroundColor: "#fff", border: "1px solid #ece7dc", borderRadius: "6px", padding: "24px", marginTop: "12px" }}>
            <Detail label="Date" value={dateLong} />
            <Detail label="Time" value={timeSlot} />
            <Detail label="Guests" value={String(partySize)} />
            {reference ? <Detail label="Reference" value={reference} /> : null}
            {specialRequests ? <Detail label="Notes" value={specialRequests} /> : null}
          </Section>

          <Text style={{ color: muted, fontSize: "14px", lineHeight: "1.6", marginTop: "20px" }}>
            We serve a single tasting menu over the course of the evening. Please
            let us know of any dietary needs by replying to this email.
          </Text>

          <Hr style={{ borderColor: "#ece7dc", margin: "28px 0" }} />
          <Text style={{ color: muted, fontSize: "12px", fontFamily: "Arial, sans-serif" }}>
            Sanbay Fusion Bar & Restaurant · 1 Main Street, City Center · +00 000 000 0000
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <tbody>
        <tr>
          <td style={{ padding: "6px 0", color: muted, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "Arial, sans-serif", width: "120px", verticalAlign: "top" }}>
            {label}
          </td>
          <td style={{ padding: "6px 0", color: ink, fontSize: "16px" }}>{value}</td>
        </tr>
      </tbody>
    </table>
  );
}
