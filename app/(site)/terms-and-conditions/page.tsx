import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/site/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Membership Terms & Conditions",
  description: `Membership application, invoice, delivery, cancellation, and service terms for ${site.name}.`,
  alternates: { canonical: "/terms-and-conditions" },
};

const keyRules = [
  ["12-month membership", "The term begins on the confirmed activation date."],
  ["3-day invoice window", "Approved members must pay the annual invoice within 3 days."],
  ["Non-refundable fee", "Membership fees are non-refundable after payment and activation except where required by law."],
  ["3-day delivery notice", "Eligible delivery requests normally require at least 3 days' advance notice."],
  ["Final package lock", "The agreed plan and package are locked after activation."],
  ["Substitutions", "An unavailable item may be replaced for a particular delivery."],
];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Membership terms"
      title="Clear terms for a considered service"
      lead="These terms explain how membership requests, annual invoices, activation, delivery entitlements, food packages, regulated products, and cancellation work. Please read them before applying or paying."
      updated="20 September 2026"
    >
      <div className="rounded-sm border border-gold/50 bg-gold/5 p-6 sm:p-8">
        <p className="text-eyebrow text-gold">Read first</p>
        <div className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2">
          {keyRules.map(([title, description]) => (
            <div key={title} className="border-t border-gold/20 pt-4">
              <h2 className="font-display text-xl font-light italic text-foreground">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground/75">{description}</p>
            </div>
          ))}
        </div>
      </div>

      <LegalSection title="1. Applying for membership">
        <p>
          Submitting a membership request does not create or activate a membership and
          does not take payment. Every application is subject to review by {site.name}.
          We may request identity, contact, delivery, age-verification, dietary, or
          product information before deciding whether to accept it.
        </p>
        <p>
          An approved application may receive an annual membership invoice. The
          membership becomes active only after the required fee is received and the
          team confirms activation.
        </p>
      </LegalSection>

      <LegalSection title="2. Term, fee, and invoice">
        <p>
          Unless the final membership agreement says otherwise, every membership lasts
          12 months from the official confirmed activation date. The annual membership
          fee provides access to the finalized plan benefits and entitlements; it does
          not necessarily include future delivery, food, beverage, or additional order
          charges.
        </p>
        <p>
          An invoice will show the customer, application reference, selected plan,
          annual fee, issue date, payment deadline, amount due, and instructions. The
          standard payment period is three days from invoice issuance. The exact date
          shown on the invoice controls.
        </p>
        <p>
          If payment is not received in time, the membership will not activate. The
          invoice or application may expire, be placed on hold, or require a new
          invoice with updated availability or pricing.
        </p>
      </LegalSection>

      <LegalSection title="3. Setup and final membership package">
        <p>
          After confirmed payment, the team normally completes membership setup within
          approximately three days. Final details may include a membership number or
          card, plan, package, delivery entitlement, start date, expiry date, and
          ordering instructions.
        </p>
        <p>
          Before activation, the member should review the final plan, food and beverage
          configuration, included products, delivery frequency, and agreed preferences.
          Once finalized and activated, that package becomes the member&apos;s historical
          membership snapshot and is ordinarily locked for the term.
        </p>
      </LegalSection>

      <LegalSection title="4. Package changes and substitutions">
        <p>
          After activation, a member may not ordinarily change plan, upgrade, downgrade,
          exchange the package, alter delivery entitlement, transfer unused benefits, or
          replace included products merely because preferences changed. Any exception
          must be expressly approved by {site.name}.
        </p>
        <p>
          Products remain subject to supplier, seasonal, import, quality-control, legal,
          and operational availability. If an included item cannot reasonably be
          supplied, we may contact the member with a suitable replacement. This is a
          delivery-specific substitution, not a permanent modification of the plan.
        </p>
      </LegalSection>

      <LegalSection title="5. Delivery entitlements and notice">
        <p>
          Each plan has a defined number of eligible delivery days per month. An
          entitlement means the member may request a delivery according to the plan; it
          does not mean a package is sent automatically.
        </p>
        <p>
          Unless another deadline is shown, delivery requests must be made at least
          three days in advance. Late requests are not guaranteed. If the finalized
          terms state that an opportunity expires, a missed deadline does not create an
          automatic refund, cash credit, replacement delivery, extension, or rollover.
        </p>
        <p>
          Unused delivery entitlements do not automatically roll over to another month
          or membership unless the final membership terms expressly allow it.
        </p>
      </LegalSection>

      <LegalSection title="6. Delivery details and customer responsibility">
        <p>
          Members are responsible for complete and accurate address, access, phone, and
          contact information; timely delivery requests and applicable order payments;
          being available for confirmed deliveries; and accurate allergy and dietary
          information. A new address may require route approval or different fees.
        </p>
        <p>
          A delivery is confirmed only after the request is within the deadline,
          selections are complete, any required payment is received, and {site.name}
          issues confirmation. Failed delivery caused by unavailable recipients,
          refused access, incorrect information, or unreachable contact details may be
          handled under the applicable delivery policy.
        </p>
      </LegalSection>

      <LegalSection title="7. Food, allergies, and returns">
        <p>
          Food preferences help the team understand the member&apos;s choices but are not
          guarantees unless expressly confirmed in the final package. Members must
          disclose allergies and dietary restrictions and should not assume they can be
          accommodated until the team confirms them. Food may be handled in environments
          where allergens are present.
        </p>
        <p>
          Because products may be perishable, prepared to order, temperature-sensitive,
          sealed for hygiene, or regulated, returns are not automatically accepted for a
          change of mind. Contact the team promptly about an incorrect, damaged, unsafe,
          or defective delivery so it can be reviewed under applicable law and policy.
        </p>
      </LegalSection>

      <LegalSection title="8. Alcohol and regulated products">
        <p>
          Alcohol options are separate regulated products. Their availability depends on
          applicable Thai licensing, age and identity verification, permitted sales
          conditions, advertising, import, premises, and delivery requirements. An
          option shown on the website does not override a legal restriction.
        </p>
        <p>
          We may refuse or withhold a regulated product when required verification cannot
          be completed. Food or other lawful parts of an order may be handled separately
          where operationally possible.
        </p>
      </LegalSection>

      <LegalSection title="9. Fees, cancellation, and expiry">
        <p>
          Once the membership fee has been paid and the membership activated, the fee is
          non-refundable except where a refund or other remedy is required by applicable
          law. Members may request cancellation at any time, but cancellation does not
          automatically refund membership fees, fulfilled orders, unused benefits, or
          unused delivery entitlements.
        </p>
        <p>
          Memberships are personal and non-transferable unless the plan expressly
          permits an approved household or business arrangement. At the end of the
          12-month term, benefits expire unless a new or renewed membership is agreed.
        </p>
      </LegalSection>

      <LegalSection title="10. Website, communications, and privacy">
        <p>
          Menus, products, prices, imagery, availability, and delivery information may
          change. We may correct genuine technical or typographical errors before
          accepting an application or order. Service communications may include
          applications, invoices, payments, activation, substitutions, delivery, and
          important service changes using the contact details provided.
        </p>
        <p>
          Personal information is handled under our{" "}
          <a className="text-gold underline decoration-gold/50 underline-offset-4" href="/privacy-policy">Privacy Policy</a>
          {" "}and applicable data-protection requirements. Historical membership and
          acceptance snapshots are not silently rewritten when website plans or terms
          change.
        </p>
      </LegalSection>

      <LegalSection title="11. Service availability and conduct">
        <p>
          Weather, transport disruption, supplier failure, government restrictions,
          emergencies, utilities, systems, or other events outside reasonable control may
          affect service. We will inform members where reasonably possible and consider
          appropriate alternatives.
        </p>
        <p>
          Fraud, chargeback abuse, false identity information, harassment, unauthorized
          resale, misuse of delivery services, attempts to bypass age restrictions, or
          other serious breaches may result in suspension or termination, subject to law.
        </p>
      </LegalSection>

      <LegalSection title="12. Electronic acceptance and governing law">
        <p>
          Applications and related transactions may be completed electronically. We may
          retain the terms version, acceptance time, request reference, and confirmation
          records. These Terms are intended to be governed by the laws of Thailand,
          subject to mandatory consumer rights and jurisdictional rules.
        </p>
        <p>
          If a provision is invalid or unenforceable, the remaining provisions continue
          to apply to the extent permitted. Nothing here excludes a right or remedy that
          cannot legally be excluded.
        </p>
      </LegalSection>

      <LegalSection title="Contact and complaints">
        <p>
          Contact us about membership, billing, delivery, food issues, substitutions,
          cancellation, privacy, or complaints at{" "}
          <a className="text-gold underline decoration-gold/50 underline-offset-4" href={`mailto:${site.email}`}>
            {site.email}
          </a>
          . Replace placeholder company, registration, address, phone, and customer
          service details in the site settings before publishing this as final legal
          advice.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
