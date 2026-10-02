# Website content review — 2 October 2026

Scope: customer-facing content and business information. Authentication, pricing calculations, payment processing, database records, delivery eligibility and application transitions were not redesigned. Google Maps was deferred at the owner's request; Contact displays the confirmed address and telephone without loading a map.

## Pages and surfaces reviewed

| Surface | Result |
| --- | --- |
| Contact, shared footer, Organization JSON-LD | Centralized official company name, street, locality, Bangkok 10120, Thailand and phone in `lib/site.ts`. Removed placeholder address, generic social link, unsupported hours and seating claims. No invented map pin, registration number or coordinates. |
| About Us | Corrected the journey, selected-month term, account prerequisites and Stripe/card-storage wording. Linked the official contact information. Retained the existing business history. |
| How It Works | Rebuilt as eight responsive step cards, from account completion to ordering; explained review, staff collection, verification payment, scheduling and expiry. |
| FAQ | Replaced old answers with 29 questions covering accounts, eligibility, plans, months, meals, excess charges, orders, review, payment, addresses, cancellations, expiry and enquiries. Fees derive from the existing plan source. |
| Terms & Conditions | Preserved the complete document and existing qualified legal clauses. Targeted changes cover account prerequisites, draft invoice review, staff collection, Standard Meal ordering versus scheduling, excess payments, selected-month expiry, cancellation requests and company contact. |
| Privacy Policy, Cookie Policy | Described actual account/address/order/application data, Stripe references and card metadata, authentication/security records, Resend messages, hosting, conditional content/address providers, cookies and session storage. Removed placeholder instructions and speculative analytics/marketing/ID-storage claims. |
| Home, Membership, Join, plan configuration and package summary | Removed unsupported room/seating benefits and delivery-day entitlement language; clarified selected service months, Standard Meal allowance and authorized collection after approval. |
| Menu, Pricing, Story | Removed fictional chef/awards, sample tasting-table prices and unverified dining promises. Menu fallback draws from the catalogue; Pricing derives fees and meal allowances from authoritative plan data; Story uses current service information. Existing CMS fetching remains supported. |
| Catalogue | Identified menu rotations as inspiration rather than delivery commitments. Clarified alcohol exclusion from current membership applications; removed public implementation-checklist claims. |
| Reservations, Events, Contact form | Reservations is a meeting request, not an instant table booking. Events already correctly describes an enquiry and team-confirmed proposal. Corrected Contact/form links and unverified reservation hours. |
| Delivery Areas, Delivery checker | Cards display active coverage only; no eligibility calculation or Google integration changes. Existing address-checker behavior is retained. |
| Accessibility | Updated restaurant-centric wording to reflect website, support and meeting arrangements; retained qualified accessibility aims. |
| Dashboard, application receipt, checkout, payment and success pages | Current draft-invoice flow checked against code. Corrected generic payment-success copy; historical payment-first receipts explicitly retain their original context. |
| Global metadata, icons and email content | Current Sanbay branding verified by repository search. Managed transactional templates already describe review before collection; no email/template sends or provider changes were needed. |

## Verified behavior and discrepancies

- `lib/membership-invoice.ts`: submission creates a draft invoice with automatic collection disabled; approval changes it to ready for staff collection. It does not itself charge. Activation requires approval and verified payment. Old automatic-charge-on-approval wording was corrected.
- `lib/account/card-verification.ts`: a separate USD $2 verification payment is refunded after success. No promise of zero payment when saving a card remains in the new informational pages.
- `lib/stripe.ts` and production variable checks: payments are **test-mode-only**. Live cards are not supported by the current code. Public payment explanations now disclose this limitation. No secrets were printed or changed.
- `lib/membership-service-months.ts`: select the plan's count of eligible months within one explicit current/next calendar year. Months may have gaps. End is exclusive at the start of the day after the final selected month, in Bangkok time.
- `lib/standard-meal.ts`, `lib/membership-benefits.ts`, `lib/standard-meal-order.ts`: future slots can be scheduled, but meal orders are placed during the corresponding selected month. Scheduling is not redemption. One eligible food order uses the plan allowance, excess is paid and other product groups are ordered separately.
- No customer self-service cancellation/refund endpoint was found. The FAQ directs customers to the team; requesting cancellation does not automatically end access or produce a refund.
- `lib/delivery.ts` has only Bangkok active. Other configured zones remain inactive and are no longer advertised as current coverage.
- Production Sanity is unconfigured, so the corrected editorial fallbacks are the served content. If Sanity is enabled later, review its published Menu and Story documents before switching over.
- Google address keys are also unconfigured. Address verification dependent on Google remains an operational setup item; no fallback or bypass was introduced. Contact Maps is explicitly deferred by the owner.

## Final search and historical exceptions

Searched application pages, components, libraries, public assets, schema definitions and project documentation for Maula/Mola branding, old prices and plan counts, annual validity, delivery-count entitlements, automatic approval charges, invoice deadlines, placeholder contact details and fictional restaurant claims.

- No old Maula/Mola branding was found in current customer-facing source or public assets.
- Current informational plan pricing uses `lib/membership-plans.ts`; no second frontend fee table was introduced. Standard Meal values still originate from `lib/standard-meal.ts`.
- `annualFee`, `annualQuantity`, `validityMonths` and old plan IDs survive only as compatibility fields, tests, comments or historical snapshot rendering. Existing records were not renamed or repriced.
- `components/membership/application-form.tsx` is an unused legacy component with an old three-day invoice consent; no route imports it (`/membership/apply` redirects to current checkout). Its consent mechanics were deliberately not rewritten during a content audit. It must not be reintroduced without a separate flow review.
- The historical PaymentIntent receipt and historical dashboard status retain payment-before-review handling for existing agreements. Current applications use the draft-invoice flow. Generic success wording no longer presents the old flow as the current journey.

## Business-owner / policy confirmation

1. Confirm cancellation effective dates, treatment of unfulfilled prepaid quantities, refunds before activation, failed-delivery remedies and substitution approval. Existing non-refundable-after-payment-and-activation wording and mandatory-rights qualifications were retained; no new blanket refund prohibition was introduced.
2. Have the complete Terms and Privacy wording reviewed for the business's actual obligations, including eligibility/age rules, dietary information, lawful bases and cross-border provider arrangements. This audit verifies implementation descriptions; it does not certify legal compliance.
3. Define retention/deletion schedules for account, transaction, consent, security and email-outbox records. The application has no comprehensive automatic retention cleanup; the policy does not promise one.
4. Confirm visiting hours, any service response-time commitments and any separate regulated-product/event offering before publishing those promises. Unverified hours and review-response guarantees were removed from current explanatory copy.
5. Confirm the existing About history (including the 2018 business background) remains approved. No new historical claims were added.
6. Live payment launch and Google address/listing setup require separate integration work. Test-mode payment restrictions and origin/auth protections were preserved.

## Validation

- Production build and TypeScript checks passed. ESLint found no errors; four existing warnings remain in the Open Graph image, booking form and two homepage imports. Changed-file lint passed.
- Browser checks passed for 20 public routes: HTTP 200, official footer details, Organization JSON-LD and absence of the audited stale wording. All 12 pricing rows matched the authoritative fee table; all 29 FAQ entries were present and keyboard expansion/collapse worked.
- Responsive checks passed at 390, 768 and 1440 pixels on Contact, About, How It Works, FAQ, Pricing, Terms and Privacy (21 checks), with no page-width overflow. Contact loads no map iframe.
- The browser run recorded one React hydration warning on the homepage under reduced-motion emulation. The content/layout assertions passed, but the run is not a zero-console-error result. Investigate the homepage animation/hydration separately; no animation behavior was changed in this content task.
- Railway deployed commit `c3ac96b68a99bf222107e7be33e58f8dacc3f299` successfully as deployment `2467abe0-964e-466a-bc4c-22b2e23cc4cc`. The deployment contains the content changes; this validation addendum is local documentation.
- Read-only checks inside the running production service returned HTTP 200 and the updated content for Contact, How It Works, FAQ, Pricing and Privacy. These checks verify the deployed application directly, not external CDN/browser caches.
