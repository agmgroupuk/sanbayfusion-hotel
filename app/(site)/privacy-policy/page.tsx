import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/site/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${site.name} collects, uses, and protects personal information.`,
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      lead="How we look after the information you share when you dine with us or contact our team."
      updated="20 September 2026"
    >
      <LegalSection title="Who we are">
        <p>
          Sanbay Fusion Bar & Restaurant operates this website and is responsible for
          the personal information collected through it. Our contact details are listed
          on the Contact page and in the footer.
        </p>
      </LegalSection>

      <LegalSection title="Information we collect">
        <p>
          We may collect your name, email address, phone number, reservation details,
          dietary or accessibility requests, and the content of messages you send us.
          We also receive basic technical information such as browser, device, and
          website usage data when you visit.
        </p>
      </LegalSection>

      <LegalSection title="How we use it">
        <p>
          We use information to manage reservations, respond to enquiries, provide the
          experience you request, improve the website, keep records, and meet legal or
          safety obligations. We do not sell personal information.
        </p>
      </LegalSection>

      <LegalSection title="Sharing and retention">
        <p>
          We may share necessary information with service providers who help us operate
          reservations, email, hosting, analytics, or payments. They may only use it
          to provide those services. We keep information only for as long as needed for
          the purpose collected, legal requirements, or legitimate business records.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <p>
          Depending on where you live, you may have rights to access, correct, delete,
          restrict, or object to our use of your personal information. To ask a
          question or make a request, email{" "}
          <a className="text-gold underline decoration-gold/50 underline-offset-4" href={`mailto:${site.email}`}>
            {site.email}
          </a>
          . We may need to verify your identity before completing a request.
        </p>
      </LegalSection>

      <LegalSection title="Updates">
        <p>
          We may update this policy when our services, technology, or legal obligations
          change. The date at the top of this page shows when it was last revised.
        </p>
      </LegalSection>
    </LegalPage>
  );
}