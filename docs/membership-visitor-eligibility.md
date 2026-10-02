# International-visitor membership eligibility

Effective for new website membership applications from 2 October 2026.

## Policy and scope

This membership program is exclusively for foreign visitors who normally live outside Thailand and travel here temporarily for tourism, holidays, business, extended visits or similar purposes. Domestic Thai customers are not eligible. Being foreign alone is not sufficient if the applicant normally lives in Thailand.

The restriction applies to this membership program, not general account creation or separate meeting, private-event and support enquiries. Accounts never activate membership automatically. Review, approval and verified payment remain required; current Stripe test-mode restrictions are unchanged.

## Implementation

- `lib/membership-eligibility.ts` owns the notice, exact declaration, version and validation schema.
- Final review presents an unchecked, keyboard-accessible confirmation. All existing payment/terms/privacy agreements and account-completeness checks remain required. Changing the selected card clears the agreements, including eligibility, for fresh confirmation.
- Both membership submission services require literal boolean `true` and the current eligibility version. False, missing, string or stale values fail before database/payment work. Retired immediate-payment and legacy form endpoints remain closed.
- Submission stores the exact server-generated declaration, version and server acceptance time inside the immutable application snapshot. No database migration is needed because the snapshot is JSONB. The saved declaration is covered by the existing application hash used for Stripe invoice integrity.
- Invoice creation and staff approval reject applications without a valid saved declaration. Staff see the declaration/time separately from delivery eligibility and must review the customer's circumstances before approving.
- A checkbox is a declaration, not automatic verification of nationality or residence. The team still assesses eligibility and can decline applications. No nationality is inferred from names, IP addresses, billing countries, telephone prefixes or Thai delivery addresses. No passport upload or new nationality/residence database fields were introduced.

## Existing records

Saved payment consent versions and invoice hashes are not rewritten. Current incomplete drafts can obtain the new declaration when submitted. Previously submitted, unapproved applications without it cannot be newly approved; staff should decline the pending application and ask the customer to reapply. An interrupted old submission without an invoice needs staff assistance rather than silently gaining a declaration.

Already approved/paid/active agreements retain their existing lifecycle and recorded terms. This update does not revoke an existing contract or add a new declaration to historical records. Administrative paid historical activation remains a historical flow; eligibility is not retrospectively fabricated. New applications cannot use that retired purchase endpoint.

## Content coverage

Updated homepage hero and membership sections, About, How It Works, FAQ, Plans, every plan detail, Membership, Join, Pricing, Menu/Catalogue membership notices, Story fallback, signup explanation, application/final review, receipt, account overview, staff review, Terms, Privacy, shared site description/tagline, manifest-derived description, Organization offer catalogue and social-preview wording.

The FAQ specifically explains eligible visitors, domestic Thai ineligibility, planning before travel, non-consecutive travel months and the absence of guaranteed approval. About explains advance food/service planning alongside hotels and transport. Existing prices, selected-month rules, Standard Meals and payment calculations are unchanged.

## Validation

- Automated tests cover omitted/false/non-boolean declarations, obsolete policy versions, declaration persistence and approval/invoice-creation rejection without eligibility.
- `scripts/verify-membership-eligibility.mjs` mounts the real final-review form with an offline API stub. It checks default-disabled submission, independent eligibility gating, keyboard control, payload/version and responsive layout without creating accounts, invoices or emails.
- Production build and TypeScript passed; changed-file lint has no errors (three existing warnings). The full default test suite passed 283 tests with 16 opt-in tests skipped; the two subsequently added approval/invoice guard tests also passed in the targeted 14-test calendar suite. The offline application browser harness passed 25 checks at mobile, tablet and desktop widths.
- Public-page browser verification passed 40 checks across membership information, plan details, signup, policies, FAQ and unrelated enquiry pages, including responsive layouts and the five eligibility FAQs. No browser errors were recorded in that run.
