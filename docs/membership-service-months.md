# Selected service months and included member meals

New purchases keep the existing twelve plan IDs, fees, application tables,
account mappings and approval/payment flow. Version 4 purchase snapshots add
`selectedServiceMonths` (sorted `YYYY-MM` values) and the included meal's name,
menu value, monthly quantity and zero cash value. `durationMonths` now represents
the service-month count for new purchases. Historical snapshots retain their
original terms and are not backfilled or repriced.

## Membership pricing

`lib/membership-plans.ts` is the only runtime source for the approved fees. Total
fees rise from THB 6,000 for one month to THB 30,000 for twelve months, with a
strictly decreasing effective monthly rate. No frontend component maintains a
separate price table. Server validation recalculates saved carts and unsubmitted
applications using this source; optional packages are calculated separately.

Application rows persist the validated fee and purchase snapshot. Stripe Draft
Invoice lines use that authorized snapshot in minor currency units. Admin review
and the customer dashboard display the same saved agreement. Submitted agreements
and existing invoices retain their authorized amounts.

There is no independent database plan-fee seed. The optional Stripe catalog/DB
mapping synchronization script also imports `membershipPlans`; its stored mappings
are not used to price the current Draft Invoice flow.

Pricing correction verification: 208 local tests passed (16 external-service tests
skipped), production build including TypeScript passed, and lint reported only
the five existing warnings. `scripts/verify-membership-pricing-browser.mjs`
verified all twelve fees on desktop/mobile cards and dialogs, configuration/cart
summaries, and the pricing, membership and join pages against the production build.

## Calendar policy

- Customers choose exactly the plan's month count within one calendar year,
  choosing the current or next year. A 12-month selection needs a year with all
  twelve eligible months. The picker defaults to a year with enough eligible months.
- The existing three-day advance-notice rule determines whether the current month
  still has an eligible service date. All dates use Asia/Bangkok.
- Months may be separated. Approval/payment activate the agreement, but ordering
  and complimentary benefits require the current Bangkok month to be selected.
  In intervening months the dashboard shows SCHEDULED and repurchase stays blocked.
- Service months become fixed on submission, including in the saved quote hash.
  The database trigger also prevents changes to the finalized months/purchase.
- Stale selections are rejected again at submission, approval and charge retry;
  no selected month is silently replaced. Staff can decline a stale pending
  application so the customer can submit a fresh, explicitly reviewed selection.
- First/last service dates describe the outer boundaries only. They do not grant
  continuous access between selected months. Legacy expiry arithmetic applies
  only to historical v1-v3 agreements.

## Duplicate purchase protection

All owned agreements are checked, including server-owned historical Stripe mappings;
matching email text alone does not establish ownership. Preparation, submission,
approval, charge attempts and activation share an account transaction lock. An
active/scheduled membership or another submitted application blocks another purchase.
Public plan cards retain information dialogs, while authenticated active members
receive a membership notice and dashboard link. Checkout/API guards enforce the rule
independently of browser state.

## Included Standard Meals

All current plans include one Standard Meal redemption per selected service month.
The authoritative allowance table in `lib/standard-meal.ts` ranges from THB 3,000
(one month) to THB 15,000 (twelve months). The approved price table remains in
`lib/membership-plans.ts`; the attachment's older price examples are not used.
An allowance is included food value, never a payable membership invoice line,
cash, cashback, transferable credit or a withdrawable balance.

`standardMealSlots` extends the existing configuration and version-4 purchase
snapshot. Each slot belongs to a selected `YYYY-MM` month. Date/time choices are
optional; zero, some or all months may be scheduled. A populated slot requires
both values, a real day within that month and three days' advance notice in Bangkok.
The half-hour selector runs from 11:00 through 24:00; midnight means the end of the
selected delivery day. There is no existing delivery-capacity service to consult;
preferences remain subject to staff confirmation. All weekdays are eligible.

Activation creates one row per selected month in the existing
`membership_benefit_redemptions` table. Paid existing v4 agreements initialize missing
rows on dashboard access using their saved allowance, without rewriting the agreement.
A future slot becomes SCHEDULED; an empty slot stays AVAILABLE with null redeemedAt.
If a proposed date is no longer eligible when activation completes, the entitlement
remains AVAILABLE for rescheduling rather than treating a past date as a booking.
The dashboard supports later scheduling and rescheduling until an order reserves the
benefit. Scheduling future selected months is allowed, including in gaps between
service months. Meal ordering remains limited to the current selected month.

Choose Standard Meal from `/dashboard/membership` to use the existing member-order
menu in food-only mode. The server reprices catalogue items and subtracts at most
the saved monthly allowance. A THB 2,700 food order with THB 3,000 allowance costs
zero; THB 3,800 costs THB 800. Zero-payment orders require explicit confirmation and
do not call Stripe. Any excess uses the existing order PaymentIntent flow. A
membership transaction lock, the unique membership/month index and an order reference
reserve the allowance for exactly one order. Repeated requests resume that order
with a stable payment idempotency key. RESERVED becomes REDEEMED only after verified
payment; zero-payment confirmations redeem atomically. Scheduling does not redeem.
Unused available/scheduled months become EXPIRED. Additional ordinary orders remain
fully chargeable and never include another membership fee.

`/admin/membership-benefits` shows schedule, entitlement status and order reference.
New Standard Meal orders can be marked fulfilled only after confirmation/payment.
Historical free-meal requests retain their previous fulfillment path.

## Membership food selection

Only membership purchase selection excludes alcohol. Existing alcohol catalogue
records, informational pages, permissions and normal ordering remain intact.
Server membership validation rejects alcohol categories and beverage add-ons even
when the browser flag is enabled. Draft-invoice creation and approval also reject
alcohol-bearing snapshots. Non-alcoholic beverages remain eligible prepaid products.
The separate Standard Meal allowance applies to eligible food only.

## Migration and verification

Apply `drizzle/0013_standard_meal_entitlements.sql` before deploying this update,
using `npm run db:migrate` with the intended database connection. It extends the
existing ledger with nullable dates, delivery times and a unique order reference,
and converts historical requested/fulfilled statuses to scheduled/redeemed. It
preserves existing membership, account, payment and catalogue records. Its journal
timestamp follows migration 0012, including on the previously baselined database.
The complete migration chain is exercised by isolated PostgreSQL integration tests.
This update has not applied the migration to Railway or changed Stripe records.


`drizzle/0011_membership_service_months.sql` is additive: a nullable months column,
benefit ledger, uniqueness/validity constraints and a finalized-agreement trigger.
The migration was verified against a fresh isolated Postgres engine through the full
migration chain. Production database changes are a separate deployment step.

Normal migration-managed installations use the existing `npm run db:migrate`
pre-deploy command. For the previously baselined Railway database, the focused
script avoids replaying old migrations and checks the ledger/hash:

```powershell
node --import tsx scripts/migrate-membership-service-months.ts
node --import tsx scripts/migrate-membership-service-months.ts --apply
```

Supply the intended database connection through the environment. The first command
is read-only. Existing Railway environment injection may be used as documented in
`membership-duration-model.md`. Neither command synchronizes Stripe products.

Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`.
Database integration tests use an isolated PGlite PostgreSQL engine and simulated
Stripe responses; real sandbox suites remain opt-in. Browser verification uses
`node scripts/verify-service-months-browser.mjs` against a local server on port 3102
(or `VERIFY_ORIGIN`), and saves desktop/tablet/mobile screenshots under
`.next/verification`. It covers all twelve dialogs, exact month counts, non-consecutive
selection, unchanged prepaid arithmetic, active-member UI and checkout persistence.

Standard Meal browser checks: `node scripts/verify-standard-meals-browser.mjs`.
They verify optional slots, saved schedules through Sign In, alcohol exclusion and
server rejection, plus the unchanged main catalogue at desktop/tablet/mobile widths.

Latest local verification: 226 tests passed, with 16 opt-in tests skipped. The
production build and TypeScript checks passed. Lint has no errors; five existing
warnings remain outside this change. All four browser scripts passed:
`verify-membership-pricing-browser.mjs`, `verify-service-months-browser.mjs`,
`verify-standard-meals-browser.mjs`, and `verify-standard-meal-order-browser.mjs`.
The last script checks the real checkout component with simulated API responses,
including explicit confirmation for a zero-payment meal and the excess-payment
summary. These checks do not constitute a live Stripe or Railway deployment test.
