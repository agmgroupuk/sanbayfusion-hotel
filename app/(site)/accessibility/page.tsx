import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/site/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Accessibility",
  description: `Accessibility statement for the ${site.name} website and restaurant experience.`,
  alternates: { canonical: "/accessibility" },
};

export default function AccessibilityPage() {
  return (
    <LegalPage
      eyebrow="Accessibility"
      title="A welcoming table for everyone"
      lead="We are working to make both our digital experience and our restaurant experience more accessible."
      updated="20 September 2026"
    >
      <LegalSection title="Our approach">
        <p>
          We aim for this website to work with keyboard navigation, readable text,
          assistive technology, reduced-motion settings, and different screen sizes.
          We continue to review pages and improve them as we find opportunities.
        </p>
      </LegalSection>

      <LegalSection title="At the restaurant">
        <p>
          If you have an access requirement, dietary need, or seating request, please
          tell our team when booking. We will do our best to explain the space and make
          reasonable arrangements before your visit.
        </p>
      </LegalSection>

      <LegalSection title="Feedback">
        <p>
          If you encounter a barrier or need information in another format, contact us
          at{" "}
          <a className="text-gold underline decoration-gold/50 underline-offset-4" href={`mailto:${site.email}`}>
            {site.email}
          </a>
          . Please include the page or part of the visit that caused difficulty so we
          can investigate it properly.
        </p>
      </LegalSection>
    </LegalPage>
  );
}