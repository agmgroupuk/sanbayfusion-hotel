# Duration-based memberships

This document describes historical v1-v3 consecutive-term agreements. New purchases
use the [selected service-month model](membership-service-months.md); historical
agreements keep the terms recorded at purchase.

The authoritative catalog is `lib/membership-plans.ts`: twelve one-time plans
lasting 1–12 calendar months, with fees of THB 6,000, 11,000, 15,000, 19,000,
23,000, 27,000, 31,000, 35,000, 39,000, 43,000, 47,000, and 50,000.

SetupIntent saves a reusable card without a membership charge. Explicit consent
and the exact quote are frozen on submission to **pending_review**. Admin approval
creates one exact-amount PaymentIntent; successful payment alone permits activation,
Member ID issuance, and start and expiry dates. Decline never charges. Failed or
authentication-required payments remain inactive with dashboard recovery. Dates follow Bangkok's
calendar. Expiry is exclusive at midnight on the expiry date. Calendar-month
arithmetic clamps month-end dates (31 January + one month → 28/29 February).

## Package pricing and snapshots

- Products: catalog unit price × monthly quantity × selected duration.
- `MONTHLY` add-ons: catalog unit price × quantity × selected duration.
- `ONE_TIME` add-ons: catalog unit price × quantity, once for the term.
- Membership only: membership fee; no prepaid products or add-ons.

The server validates quantities and product eligibility and obtains prices,
duration, and add-on pricing types from catalog data. Existing beverage add-ons
are explicitly `ONE_TIME`; the pricing engine also supports `MONTHLY` catalog
entries. No browser price, pricing type, duration, or total is trusted.

Version 3 purchase snapshots store each product's unit price, monthly quantity,
duration, total term quantity, pricing type, and total. Add-ons also record their
pricing type and term quantity. Checkout locks account draft creation and paid
recording uses a row lock. Submission locks the agreement; catalog edits
do not reprice paid records. Payment metadata is checked against a canonical
snapshot hash that remains stable when Postgres JSONB reorders object keys.

Monthly product quantities do **not** imply a number of deliveries. New
agreements create no automatic delivery slots. Scheduling/distribution remains
separate; the historical delivery ledger is retained for earlier agreements.

## History and database compatibility

New plan IDs are `duration-1` through `duration-12`; historical IDs `01`–`20`
are never reused. No destructive schema migration is needed:

- The application field `durationMonths` maps to the existing `validity_months`
  SQL column. Existing values are unchanged.
- Legacy fee/delivery columns remain to read historical records. New purchases
  write zero delivery allowances and use the version 3 package snapshot.
- Version 1/2 JSON snapshots keep their original keys and quantities. The UI
  renders these as historical agreements, rather than interpreting them as the
  new monthly package model.
- Existing active legacy members retain their ordering category permissions.

Ordering pages and the payment-intent API independently check the expiry date,
even if the stored status is still active. Access resolves/persists expired
status on demand. Renewal inserts a new term; it never extends or replaces the
old paid agreement. No cron job is required for access enforcement.

## Stripe Sandbox synchronization

`npm run stripe:sync-memberships` requires a `sk_test_` key and a database URL.
It creates/reuses exactly twelve active one-time THB products/prices, verifies
their mappings, and archives obsolete Sandbox products/prices. Historical
mapping rows remain with mode `archived`. The script writes only the
`stripe_membership_catalog` table and never edits customer/payment/membership
records or creates subscriptions.

For this linked Railway project, use environment injection:

```powershell
railway.cmd run --service sanbayfusion-hotel --environment production --no-local -- node scripts/with-railway-database.mjs scripts/sync-stripe-memberships.ts
```

The wrapper verifies the linked project's identity and matching Postgres
credentials internally. If no public database endpoint exists, it opens a
temporary Railway SSH tunnel. Credentials stay in process memory; no `.env`
file is written and tunnel connection details are suppressed.

`scripts/inspect-membership-environment.ts` reports variable status and catalog
data without secret values. `scripts/verify-stripe-membership-checkout.ts`
checks both quote modes against Sandbox PaymentIntent creation and cancels the
verification intents without charging or changing application records.

## Application-first verification

`lib/membership-application.sandbox.test.ts` uses the existing Railway Sandbox key
and real Stripe objects. Database fixture accounts and memberships are enclosed
in transactions that always roll back. No existing customer records are changed.
Sandbox Stripe verification objects remain as test evidence; no Live API is used.
Run through `scripts/verify-membership-applications.mjs` with the Railway wrapper.

The production database uses an older baselined migration journal. The reviewed
`scripts/migrate-membership-applications.ts` applies only missing additive schema
from 0007, 0008, and 0009, preserving the existing journal and historical rows.
Do not blindly replay older migrations against that environment.
