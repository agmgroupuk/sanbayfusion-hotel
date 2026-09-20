import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/site/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${site.name} collects, uses, shares, and protects personal information.`,
  alternates: { canonical: "/privacy-policy" },
};

const privacyPrinciples = [
  ["Collect what we need", "We request information needed to review memberships, arrange service, deliver products, communicate, and meet legal obligations."],
  ["Keep service and marketing separate", "Essential membership messages are different from optional news and promotional communications."],
  ["Protect the record", "Membership applications and acceptance records may be retained to manage the relationship and resolve disputes."],
  ["Respect your choices", "You can ask questions about your information and exercise applicable privacy rights."],
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="Your information, handled with care"
      lead="This policy explains what Sanbay Fusion may collect through membership applications, contact forms, delivery services, and related customer interactions, and how we use it."
      updated="20 September 2026"
    >
      <div className="rounded-sm border border-gold/50 bg-gold/5 p-6 sm:p-8">
        <p className="text-eyebrow text-gold">Our approach</p>
        <div className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2">
          {privacyPrinciples.map(([title, description]) => (
            <div key={title} className="border-t border-gold/20 pt-4">
              <h2 className="font-display text-xl font-light italic">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground/75">{description}</p>
            </div>
          ))}
        </div>
      </div>

      <LegalSection title="1. Who controls your data">
        <p>
          Sanbay Fusion operates this website and is responsible for personal information
          collected through it. The legal company name, registration number, registered
          address, privacy contact, and customer-service details must be verified in the
          site settings before this policy is treated as final legal advice.
        </p>
        <p>
          Privacy questions and requests can be sent to{" "}
          <a className="text-gold underline decoration-gold/50 underline-offset-4" href={`mailto:${site.email}`}>{site.email}</a>.
        </p>
      </LegalSection>

      <LegalSection title="2. Where this policy applies">
        <p>
          This policy covers the website, membership requests and applications, membership
          administration, contact forms, reservations, invoices, payments, food and
          beverage orders, deliveries, customer support, email, telephone, LINE or other
          messaging channels used by the business, promotions, and customer feedback.
        </p>
      </LegalSection>

      <LegalSection title="3. Information we may collect">
        <p>Depending on how you interact with us, this may include:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Identity and contact details such as name, phone, email, LINE ID, and preferred contact method.</li>
          <li>Delivery details such as address, building, unit, district, province, postal code, access instructions, and landmarks.</li>
          <li>Membership plan, fee, request status, delivery entitlement, configuration, food preferences, beverage selections, add-ons, cancellation requests, and final package records.</li>
          <li>Invoice number, amount, issue date, payment deadline, status, transaction reference, and dispute information. Payment-card numbers, CVV codes, and online-banking passwords should not be stored directly by Sanbay Fusion.</li>
          <li>Allergy and dietary information that you choose to provide. Please share only what is reasonably necessary for the team to assess your request safely.</li>
          <li>Age confirmation or limited verification information where regulated products require it.</li>
          <li>Technical information such as IP address, browser, device, pages visited, session data, security logs, and error logs.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. How we collect it">
        <p>
          We collect information directly from you through applications, forms, email,
          calls, delivery requests, payment steps, and customer support. We may also
          receive limited information from hosting, payment, delivery, messaging, or
          other service providers where necessary and permitted.
        </p>
        <p>
          Some technical information may be collected automatically through website
          systems, cookies, security logs, and similar technologies.
        </p>
      </LegalSection>

      <LegalSection title="5. Why we use personal information">
        <p>
          We use information to receive and review membership applications, contact
          applicants, prepare configurations, issue invoices, confirm payments, create
          membership records, arrange orders and deliveries, communicate substitutions,
          respond to support requests, prevent fraud, secure systems, maintain business
          records, comply with law, and establish or defend legal claims.
        </p>
        <p>
          Depending on the activity and applicable law, the relevant basis may include
          providing a requested service, complying with a legal obligation, legitimate
          operational interests, or your consent. Where processing relies on consent,
          you may withdraw it as permitted by law.
        </p>
      </LegalSection>

      <LegalSection title="6. Membership records and acceptance">
        <p>
          A membership request may create a record containing the application number,
          selected plan, submitted configuration, customer and delivery details, terms
          and privacy acknowledgement, status, and submission time. We may also retain
          the terms and privacy policy versions accepted with the request.
        </p>
        <p>
          These records help us administer the relationship and preserve what was
          requested or agreed. Updating this website policy does not silently rewrite a
          historical membership snapshot.
        </p>
      </LegalSection>

      <LegalSection title="7. When we share information">
        <p>
          We do not sell personal information as a business model. We may share only what
          is reasonably necessary with providers that help operate hosting, email,
          messaging, payments, delivery, customer support, accounting, IT, security, or
          professional services. Delivery partners may receive a name, address, phone,
          instructions, and order reference needed to complete a delivery.
        </p>
        <p>
          We may disclose information where required or permitted by law, for lawful
          requests, fraud investigation, safety, legal claims, or protection of our
          rights. Actual vendors and any international transfer arrangements should be
          added once the production providers are confirmed.
        </p>
      </LegalSection>

      <LegalSection title="8. Retention and security">
        <p>
          We keep information only as long as reasonably necessary for the purpose it was
          collected, applicable tax, accounting, legal, contractual, dispute, security,
          and compliance requirements. Different categories may have different retention
          periods. When no longer needed, information should be securely deleted or
          anonymized where appropriate.
        </p>
        <p>
          We use appropriate organizational and technical measures such as secure
          connections, restricted access, role-based permissions, secure hosting,
          updates, backups, monitoring, and audit records. No online system can promise
          absolute security.
        </p>
      </LegalSection>

      <LegalSection title="9. Marketing and service messages">
        <p>
          Service communications about applications, invoices, payment, activation,
          delivery, substitutions, support, security, cancellation, and important
          changes may be sent where necessary or permitted even if you opt out of
          marketing.
        </p>
        <p>
          Promotional messages are separate and optional. Where marketing is used, it
          should have its own consent control and an appropriate unsubscribe method. You
          should not have to accept marketing to apply for membership.
        </p>
      </LegalSection>

      <LegalSection title="10. Cookies and technical data">
        <p>
          Cookies and similar technologies may support essential website operation,
          security, sessions, forms, membership configuration, preferences, analytics,
          performance, or marketing where implemented and permitted. Non-essential
          cookies should be handled through an appropriate consent or preference control.
        </p>
        <p>
          See our{" "}
          <a className="text-gold underline decoration-gold/50 underline-offset-4" href="/cookie-policy">Cookie Policy</a>
          {" "}for more detail.
        </p>
      </LegalSection>

      <LegalSection title="11. Your privacy rights">
        <p>
          Subject to applicable law and relevant exceptions, you may have rights to
          access, correct, delete, restrict, object to, or receive certain personal
          information, and to withdraw consent where consent is the basis. These rights
          are not absolute; for example, some invoice, accounting, security, or dispute
          records may need to be retained.
        </p>
        <p>
          To make a request, email{" "}
          <a className="text-gold underline decoration-gold/50 underline-offset-4" href={`mailto:${site.email}`}>{site.email}</a>
          {" "}with your name, contact details, the nature of the request, and any relevant
          membership or application reference. We may reasonably verify identity first.
        </p>
      </LegalSection>

      <LegalSection title="12. Regulated products and children">
        <p>
          Where alcohol or another regulated product is offered, we may process limited
          information needed to verify eligibility and comply with legal requirements.
          We collect only what is reasonably necessary and do not retain identity
          documents merely because an ID was visually checked unless legally justified.
        </p>
        <p>
          Membership services are not intended to encourage children to independently
          purchase age-restricted products. Appropriate age and identity controls apply
          where required.
        </p>
      </LegalSection>

      <LegalSection title="13. Changes and complaints">
        <p>
          We may update this policy for legal, technology, vendor, operational, or
          security changes. The revised date will appear at the top. Material changes
          affecting an active relationship should be handled consistently with applicable
          law and the relevant membership agreement.
        </p>
        <p>
          If you have a privacy concern, contact us at{" "}
          <a className="text-gold underline decoration-gold/50 underline-offset-4" href={`mailto:${site.email}`}>{site.email}</a>.
          {" "}You may also have the right to contact the competent data-protection
          authority under applicable law.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
