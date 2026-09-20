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

export type ContactEmailData = {
  name: string;
  email: string;
  phone?: string;
  message: string;
};

export function ContactMessageEmail({
  name,
  email,
  phone,
  message,
}: ContactEmailData) {
  return (
    <Html>
      <Head />
      <Preview>{`New enquiry from ${name}`}</Preview>
      <Body style={{ backgroundColor: "#f4f4f5", margin: 0, fontFamily: "Arial, sans-serif" }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "32px" }}>
          <Heading style={{ fontSize: "20px", margin: "0 0 16px" }}>
            New enquiry
          </Heading>
          <Section style={{ backgroundColor: "#fff", borderRadius: "6px", padding: "20px", fontSize: "14px", lineHeight: "1.7" }}>
            <Text style={{ margin: 0 }}><strong>Name:</strong> {name}</Text>
            <Text style={{ margin: 0 }}><strong>Email:</strong> {email}</Text>
            {phone ? <Text style={{ margin: 0 }}><strong>Phone:</strong> {phone}</Text> : null}
            <Text style={{ margin: "12px 0 0", whiteSpace: "pre-wrap" }}>{message}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
