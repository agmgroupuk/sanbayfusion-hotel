import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/site/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: `Terms and conditions for using ${site.name}'s website, reservations, and services.`,
  alternates: { canonical: "/terms-and-conditions" },
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms & Conditions"
      lead="The simple terms that guide reservations, visits, and use of this website."
      updated="20 September 2026"
    >
      <LegalSection title="About these terms">
        <p>
          These terms apply when you visit this website, contact us, make a reservation,
          or visit Sanbay Fusion Bar & Restaurant. By using the website, you agree to
          follow them. We may update these terms from time to time and will publish the
          current version here.
        </p>
      </LegalSection>

      <LegalSection title="Reservations">
        <p>
          Reservation availability is subject to confirmation. Please provide accurate
          contact details and arrive on time for your booking. If you need to cancel or
          change a reservation, contact us as early as possible using the details on our
          Contact page.
        </p>
        <p>
          Any deposit, cancellation charge, seating time, or booking condition shown at
          the time of reservation forms part of that reservation.
        </p>
      </LegalSection>

      <LegalSection title="Website content">
        <p>
          We take care to keep menus, opening hours, prices, images, and other content
          accurate, but details can change. Allergens, ingredients, and dietary options
          should always be confirmed with our team before ordering.
        </p>
        <p>
          Content on this website belongs to {site.name} or its content partners. You
          may view it for personal use, but may not copy, republish, or commercially
          reuse it without permission.
        </p>
      </LegalSection>

      <LegalSection title="Our responsibility">
        <p>
          We are not responsible for temporary unavailability, delays caused by events
          outside our reasonable control, or information on third-party websites linked
          from this site. Nothing in these terms limits rights that cannot legally be
          limited.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about these terms can be sent to{" "}
          <a className="text-gold underline decoration-gold/50 underline-offset-4" href={`mailto:${site.email}`}>
            {site.email}
          </a>
          . Please replace the placeholder business details in our site settings before
          publishing this page as final legal advice.
        </p>
      </LegalSection>
    </LegalPage>
  );
}