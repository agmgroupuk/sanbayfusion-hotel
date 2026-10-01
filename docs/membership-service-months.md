# Selected service months and included member meals

New purchases keep the existing twelve plan IDs, fees, application tables,
account mappings and approval/payment flow. Version 4 purchase snapshots add
`selectedServiceMonths` (sorted `YYYY-MM` values) and the included meal's name,
menu value, monthly quantity and zero cash value. `durationMonths` now represents
the service-month count for new purchases. Historical snapshots retain their
original terms and are not backfilled or repriced.

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

## Included meals

All plans include one meal per selected month. The plan's eligible menu value ranges
from THB 2,000 to THB 7,500, in THB 500 increments, with the requested Welcome,
Member, Premium, Signature, Executive and VIP meal tiers. This is included in the
membership fee and never added to prepaid or extra-order totals.

The customer requests the current month's meal in `/dashboard/membership`, choosing
a date in that month with three days' notice. The team confirms eligible menu and
availability; `/admin/membership-benefits` lists requests and records fulfillment.
`membership_benefit_redemptions` has one unique record per membership/month. A
request reserves that benefit; retries cannot reserve another. The server derives
the name and menu value from the saved agreement, validates ownership and current
entitlement, and never creates a Stripe payment or paid customer order. No automatic
rollover, cash balance, refund, customer rescheduling or repeated redemption exists.

## Migration and verification

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
