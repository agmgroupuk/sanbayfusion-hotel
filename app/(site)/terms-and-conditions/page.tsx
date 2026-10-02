import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/site/legal-page";
import { membershipEligibilityNotice } from "@/lib/membership-eligibility";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Membership Terms & Conditions",
  description: `Membership application, invoice, delivery, cancellation, and service terms for ${site.name}.`,
  alternates: { canonical: "/terms-and-conditions" },
};

const keyRules = [
  ["International visitors only", membershipEligibilityNotice],
  ["1 to 12 month membership", "Choose exactly 1 to 12 eligible calendar service months, not necessarily consecutive."],
  ["Apply before payment", "Submit without a membership charge. Approval makes the authorized invoice ready for staff collection; verified successful payment activates membership."],
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
      updated="2 October 2026"
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

      <LegalSection title="1. Eligibility and applying for membership">
        <p>{membershipEligibilityNotice} Eligible applicants are foreign customers normally resident outside Thailand who travel here temporarily for tourism, holidays, business trips, extended visits or similar purposes. Foreign nationality alone does not establish eligibility if the customer normally lives in Thailand.</p>
        <p>This particular program allows eligible visitors to plan applicable food and service requirements around their travel schedule, before or during their visit. Domestic Thai customers may not apply for or purchase this membership through the website. These membership eligibility rules do not impose additional restrictions on separate meeting, private-event or support enquiries.</p>
        <p>Applicants must confirm eligibility truthfully before submitting. We retain the declaration with the application and review it before approval; we may contact you to clarify your circumstances. An account, a saved payment method or a submitted application does not guarantee approval or activate membership. If you do not meet the requirements, do not submit a membership application. Existing agreements retain their recorded terms.</p>
        <p>
          Selecting a plan does not activate membership. Complete your personal information, billing and eligible delivery addresses in Account Center, verify a saved payment method and set a default card before applying. Application checkout records your authorization
          for the displayed membership and package amount. Submission places the application
          in pending review status without charging the membership fee.
          We may request identity, contact, delivery, age-verification, dietary, or
          product information before deciding whether to accept it.
        </p>
        <p>
          Approval makes your draft invoice ready for staff to collect the exact authorized amount using the agreed saved payment method. Approval alone does not collect payment.
          Declined applications are not charged. Your bank may require further authentication
          or a different payment method. The
          membership becomes active and a Member ID is issued only after approval and verified successful payment.
        </p>
        <p>Card verification is separate: Account Center uses a USD $2 verification payment and initiates a refund after successful verification. Your issuer may take additional time to display the refund. Online payments currently operate in test mode; live card payments are not available.</p>
      </LegalSection>

      <LegalSection title="2. Term, fee, and authorized charge">
        <p>
          Each new membership covers exactly the selected 1 to 12 service months in one explicit calendar year, subject to approval and successful payment. Months need not be consecutive; service entitlement exists only in the selected months. The dashboard distinguishes upcoming, current and completed months. Selected months become fixed on final submission. Existing agreements retain their saved terms.
        </p>
        <p>
          One Standard Meal allowance is included per selected service month, up to the menu value shown for your plan. It applies to eligible food in one meal order, separately from prepaid packages and extra orders. Any excess is payable at checkout; drinks and other products must be ordered separately. Unused allowance has no cash value and does not accumulate, carry forward, or convert into refunds or credit. You may schedule a future selected month now or choose Schedule later. Place the meal order during its selected service month; saving a delivery slot alone does not place or redeem an order. At least three calendar days of scheduling notice and confirmation of eligible menu and availability are required. You cannot purchase another membership while your existing membership is ongoing or has service months remaining.
        </p>
        <p>
          Your submitted application records the exact membership and package amount
          you authorize. The saved payment method is charged only after approval.
          Any changed amount requires new customer confirmation.
        </p>
        <p>
          Saving a card does not guarantee payment. If the issuer requires authentication
          or declines the charge, membership remains inactive until payment succeeds.
          Follow the payment action shown in Account Center or contact the team to resolve payment on the approved invoice. Changing a default card does not rewrite a submitted payment agreement.
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

      <LegalSection title="5. Package quantities and delivery notice">
        <p>
          Selected prepaid product quantities are monthly quantities. Each product is priced
          at its unit price multiplied by its monthly quantity and the membership duration.
          Monthly add-ons follow the same rule; one-time add-ons are charged once.
          Package quantities do not specify delivery counts. Scheduling and distribution
          are arranged separately within the selected service months.
        </p>
        <p>
          Unless another deadline is shown, delivery requests must be made at least
          three calendar days in advance. Standard Meal slots run from 11:00 AM to midnight in half-hour steps, using Bangkok time. Midnight closes the selected day. Late requests are not guaranteed. If the finalized
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
          Alcohol is excluded from the current membership application and prepaid package flow. Catalogue references do not constitute permission to purchase or deliver a regulated product. Any separate offering depends on
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
          law. Members may request cancellation by contacting the team with their application or Member ID. A request requires review and confirmation and does not itself end access or cancel an invoice. Cancellation does not
          automatically refund membership fees, fulfilled orders, unused benefits, or
          unused package quantities.
        </p>
        <p>
          Memberships are personal and non-transferable unless the plan expressly
          permits an approved household or business arrangement. At the end of the
          last selected calendar month, benefits expire at the start of the following day in Bangkok time. There is no automatic renewal or recurring membership charge. Historical agreements retain their saved terms.
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
          {" "}or {site.phone}. The service is operated by {site.legalName}. Our business location is {site.address.line1}, {site.address.line2}, {site.address.city} {site.address.postalCode}, {site.address.country}.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
