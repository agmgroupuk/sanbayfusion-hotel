import { pageMetadata } from "@/lib/seo";
import { LegalPage, LegalSection } from "@/components/site/legal-page";
import { site } from "@/lib/site";

export const metadata = pageMetadata("/accessibility");

export default function AccessibilityPage() {
  return (
    <LegalPage
      eyebrow="Accessibility"
      title="A welcoming table for everyone"
      lead="We are working to make our website, customer support and meeting arrangements more accessible."
      updated="2 October 2026"
    >
      <LegalSection title="Our approach">
        <p>
          We aim for this website to work with keyboard navigation, readable text,
          assistive technology, reduced-motion settings, and different screen sizes.
          We continue to review pages and improve them as we find opportunities.
        </p>
      </LegalSection>

      <LegalSection title="Meetings and events">
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
