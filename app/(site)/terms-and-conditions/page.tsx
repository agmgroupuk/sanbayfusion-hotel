import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/site/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Membership Terms & Conditions",
  description: `Membership application, invoice, delivery, cancellation, and service terms for ${site.name}.`,
  alternates: { canonical: "/terms-and-conditions" },
};

const keyRules = [
  ["1 to 12 month membership", "Choose exactly 1 to 12 eligible calendar service months, not necessarily consecutive."],
  ["Apply before payment", "Submit without a membership charge. Approval triggers the exact authorized charge; successful payment activates membership."],
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
      lead="These terms explain how membership requests, payments, activation, package quantities, food packages, regulated products, and cancellation work. Please read them before applying or paying."
      updated="1 October 2026"
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
          Selecting a plan does not activate membership. Application checkout saves your payment method securely and records your authorization
          for the displayed membership and package amount. Submission places the application
          in pending review status without charging the membership fee.
          We may request identity, contact, delivery, age-verification, dietary, or
          product information before deciding whether to accept it.
        </p>
        <p>
          If approved, we attempt the exact authorized charge using your saved payment method.
          Declined applications are not charged. Your bank may require further authentication
          or a different payment method. The
          membership becomes active only after the required fee is received and the
          team confirms activation.
        </p>
      </LegalSection>

      <LegalSection title="2. Term, fee, and authorized charge">
        <p>
          Each new membership covers exactly the selected 1 to 12 service months in one explicit calendar year, subject to approval and successful payment. Months need not be consecutive; service entitlement exists only in the selected months. The dashboard distinguishes upcoming, current and completed months. Selected months become fixed on final submission. Existing agreements retain their saved terms.
        </p>
        <p>
          One complimentary member meal is included per selected service month, up to the menu value shown for your plan. This is separate from prepaid packages and extra orders. Complimentary benefit has no cash value and applies only to eligible included menu selections. Unused benefits do not accumulate, carry forward, or convert into refunds or credit. Redemption requires a request during the selected month, at least three days of advance scheduling, and team confirmation of eligible menu and availability. You cannot purchase another membership while your existing membership is active or has service months remaining.
        </p>
        <p>
          Your submitted application records the exact membership and package amount
          you authorize. The saved payment method is charged only after approval.
          Any changed amount requires new customer confirmation.
        </p>
        <p>
          Saving a card does not guarantee payment. If the issuer requires authentication
          or declines the charge, membership remains inactive until payment succeeds.
          Use your dashboard to authenticate, update the payment method, or retry.
        </p>
      </LegalSection>

      <LegalSection title="3. Setup and final membership package">
        <p>
          After approval and confirmed payment, membership activates. Details include a membership number or
          card, plan, package, package quantity, start date, expiry date, and
          ordering instructions.
        </p>
        <p>
          Before activation, the member should review the final plan, food and beverage
          configuration, included products, monthly quantities, and agreed preferences.
          Once finalized and activated, that package becomes the member&apos;s historical
          membership snapshot and is ordinarily locked for the term.
        </p>
      </LegalSection>

      <LegalSection title="4. Package changes and substitutions">
        <p>
          After activation, a member may not ordinarily change plan, upgrade, downgrade,
          exchange the package, alter package quantity, transfer unused benefits, or
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
          Selected prepaid product quantities are monthly quantities. Each product is priced
          at its unit price multiplied by its monthly quantity and the membership duration.
          Monthly add-ons follow the same rule; one-time add-ons are charged once.
          Package quantities do not specify delivery counts. Scheduling and distribution
          are arranged separately within the membership term.
        </p>
        <p>
          Unless another deadline is shown, delivery requests must be made at least
          three days in advance. Late requests are not guaranteed. If the finalized
          terms state that an opportunity expires, a missed deadline does not create an
          automatic refund, cash credit, replacement delivery, extension, or rollover.
        </p>
        <p>
          Unused package quantities do not automatically roll over to another month
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
          unused package quantities.
        </p>
        <p>
          Memberships are personal and non-transferable unless the plan expressly
          permits an approved household or business arrangement. At the end of the
          selected membership term, benefits expire unless a new or renewed membership is agreed.
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
