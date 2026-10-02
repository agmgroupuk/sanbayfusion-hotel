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
      updated="2 October 2026"
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
          {site.legalName} operates this website and is responsible for personal information collected through it. Our business location is {site.address.line1}, {site.address.line2}, {site.address.city} {site.address.postalCode}, {site.address.country}. You can contact us on {site.phone}.
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
          beverage orders, deliveries, Account Center, customer support, email and telephone enquiries.
        </p>
      </LegalSection>

      <LegalSection title="3. Information we may collect">
        <p>Depending on how you interact with us, this may include:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Account and contact details such as name, phone, email, profile information and enquiry messages.</li>
          <li>Billing and delivery addresses, country, building or unit, district, province, postal code, delivery instructions and location information supplied for address checks.</li>
          <li>Membership eligibility declarations: your confirmation that you are a foreign visitor normally living outside Thailand and visiting temporarily, the declaration text and policy version, and acceptance time. We use this information for membership review; creating an account does not by itself confirm eligibility.</li>
          <li>Membership plan and price, selected service months, application status, configuration, food preferences, add-ons, Standard Meal allowances and schedules, cancellation correspondence and final agreement records.</li>
          <li>Orders, product quantities, totals, payment and fulfilment status; meeting requests and private-event briefs, including event and travel dates you provide, times, duration, guest count, venue or area, dining and dietary preferences, beverage discussion preferences, entertainment, production and special requests, and preferred contact method.</li>
          <li>Stripe customer, payment-method, invoice, payment and refund references; amounts, currencies and statuses; card brand, last four digits, expiry, verification and default-card status. Card entry is handled through Stripe. Our application does not store complete card numbers, CVC or online-banking passwords.</li>
          <li>Allergy and dietary information that you choose to provide. Please share only what is reasonably necessary for the team to assess your request safely.</li>
          <li>Authentication and security records, including password hashes, session and reset-token hashes, email-change requests, two-factor settings, encrypted authenticator secrets, hashed recovery codes and account security events.</li>
          <li>Operational request and error logs, session data and abuse-prevention records. Hosting and connected providers may process IP addresses and request information to deliver and secure their services.</li>
          <li>Transactional email content, recipient address, delivery status and provider references. Where email tracking is enabled, the email provider may also record message opens and link interactions.</li>
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
          We use information to receive and review membership applications and visitor eligibility, contact
          applicants, prepare configurations, issue invoices, confirm payments, create
          membership records, arrange orders and deliveries, communicate substitutions,
          prepare tailored event proposals and contact you about your brief through your preferred method, respond to support requests, prevent fraud, secure systems, maintain business
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
          selected plan, submitted configuration, international-visitor eligibility declaration, customer and delivery details, terms
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
          rights.
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Stripe processes card entry, verification, invoices, payments and refunds, and returns payment status and safe card references to the application.</li>
          <li>Resend sends account, security, application, payment, order, delivery and enquiry emails. Email recipients, message content and delivery records are processed for those sends.</li>
          <li>Railway hosts the application and database and processes the records and operational logs needed to run them.</li>
          <li>Sanity supplies editorial content when configured. Requests for hosted content or images may disclose technical request information to that provider.</li>
          <li>The delivery checker supports Google address search and geocoding when configured. Address queries and selected location information are sent to Google when those features are used. The Contact page currently has no embedded map.</li>
        </ul>
        <p>Providers may process information outside Thailand. The location and handling of that processing depend on the provider and service configuration. Contact us for questions about the providers used for your information.</p>
      </LegalSection>

      <LegalSection title="8. Retention and security">
        <p>
          We keep information only as long as reasonably necessary for the purpose it was
          collected, applicable tax, accounting, legal, contractual, dispute, security,
          and compliance requirements. Different categories may have different retention
          periods. Account, transaction, consent and email-delivery records are stored beyond individual sessions; closing a browser or deleting cookies does not delete those records. Contact us about retention or deletion of your information.
        </p>
        <p>
          The application uses password hashing, hashed session and recovery tokens, encrypted authenticator secrets, access checks and account security records. Payment card entry is handled by Stripe. No online system can promise absolute security. Do not send passwords, recovery codes or card security codes in enquiry forms or email.
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
          Creating an account or applying for membership does not enrol you in a marketing mailing list. The current application sends service and security messages; these are separate from any promotional communications.
        </p>
      </LegalSection>

      <LegalSection title="10. Cookies and technical data">
        <p>
          First-party cookies maintain sign-in sessions and preserve membership checkout selections. Browser session storage also retains membership selections and the return path through Account Center. Stripe and configured address-search or content providers may use their own browser technologies. The application currently includes no separate advertising or site-analytics tracker.
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

      <LegalSection title="12. Information you share in enquiries">
        <p>
          Free-text enquiries, dietary notes and event briefs may contain information you choose to share. Provide only details needed for the request. Please do not include identity documents, sensitive information about other people or payment credentials in these fields.
        </p>
        <p>
          Alcohol is excluded from current membership applications. If a separate service requires eligibility information, the team will explain what is needed for that request. Contact us if information about a child has been submitted and needs review.
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
