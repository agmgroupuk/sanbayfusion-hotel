# Dashboard membership applications and Stripe draft invoices

New applications use the existing `customer_accounts`, `account_addresses`, and `membership_requests` records. The Account Center remains the sole editable profile source. The existing twelve prices, cart pricing, selected service months and included monthly benefits are unchanged.

## Customer flow

1. Save personal information and default billing/Thailand delivery addresses in the Dashboard.
2. Add cards in **Dashboard → Payment Methods**. Stripe Payment Element collects the card. A separate PaymentIntent charges exactly **200 USD cents**, with `setup_future_usage=off_session`. Successful verification attaches the card to the existing customer and creates a full refund. Signed payment/refund webhooks and browser completion retrieve current Stripe state. `card_verifications` stores only references, amount/currency and actual verification/refund states. Previously attached cards without this verification are labelled unverified and cannot authorize new applications.
3. Configure a plan, exact `YYYY-MM` service months, and optional prepaid items. Existing server cookies and session storage preserve the cart. The final review reads Dashboard information; missing information opens a section-specific completeness dialog. A Dashboard return banner leads back to the preserved cart.
4. Choose the default verified card or another verified owned card, review the exact server total, and accept charge authorization, terms and privacy. Profile changes between review and submission require another review.
5. Submission persists a version-2 immutable application agreement, then prepares exactly one THB draft invoice. It creates no membership PaymentIntent, makes no membership charge and issues no Member ID.

## Staff workflow

Open **Admin → Membership applications**. Review the saved customer, addresses, cart, months, total and card. The invoice link opens the corresponding Stripe Sandbox invoice.

- **Decline:** delete the draft, or void an unexpectedly finalized unpaid invoice, before marking the application declined. A paid invoice requires investigation and cannot be silently declined.
- **Approve:** records approval and labels the invoice ready for staff collection. The invoice remains a draft with `auto_advance=false`; approval does not finalize or charge it.
- After website approval, open that invoice in Stripe Dashboard. Finalize and collect it using the saved payment method already set on the invoice. Do not create a second PaymentIntent, rebuild the cart, change its amount/card, or mark it paid out of band.
- If the issuer needs authentication, the customer’s **Review payment** page authenticates the existing invoice PaymentIntent using Stripe.js. New cards are still added only through the Dashboard verification flow. A failed payment leaves membership inactive; staff retry the same invoice.

Stripe administrators retain the ability to manually finalize/collect invoices independently of the website. Stripe does not enforce Sanbay Fusion’s local approval flag. Pending invoices are labelled **DO NOT COLLECT**, automatic advancement is disabled, and the webhook refuses activation without recorded website approval. See [Stripe automatic advancement](https://docs.stripe.com/invoicing/integration/automatic-advancement-collection).

Submitted card/address/price agreements do not follow subsequent account defaults. A different card requires a separately validated customer authorization, which this phase does not silently substitute. Historical unpaid applications using the old SetupIntent agreement must be declined and resubmitted through the new flow before staff can approve them. Existing historical payment reconciliation remains available.

## Payment proof and separate states

| Record | Before approval | Approved, unpaid | Successful authorized invoice payment |
| --- | --- | --- | --- |
| Application state | `pending_review` | `approved` | `completed` |
| Stripe invoice state | `draft` | `draft` / `open` | `paid` |
| Membership | Inactive | Inactive | Active, with service only in selected months |

The handler verifies the Stripe signature and rejects Live events. It retrieves current invoice/payment objects and validates the invoice ID, customer, account, immutable agreement hash, THB amount, selected card, successful PaymentIntent and paid invoice-payment allocation. A paid label, customer credit, an out-of-band payment or the $2 verification cannot activate membership. A changed total is rejected for staff review rather than silently adjusting the authorized amount.

Account/application locks serialize submission and approval. Stable keys plus remote invoice/line metadata recover interrupted writes beyond Stripe’s idempotency retention window. Database triggers protect submitted snapshots and unique indexes protect invoice associations. Activation preserves one Member ID and the existing selected-month benefit/package rules. Pending Dashboard pages refresh automatically to display webhook updates. Paid invoice PDFs are linked from the Dashboard; Stripe receipt emails depend on Stripe’s email settings.

## Notifications

Pending requests appear in the existing admin queue. When Resend is configured, submission sends a team email (`RESTAURANT_NOTIFY_EMAIL`) and a customer confirmation, using stable provider idempotency keys and a persisted sent timestamp. No card credentials are included. This environment currently has neither Resend nor the staff notification email configured; outbound messages are therefore not sent.

## Schema and verification

`0011_membership_service_months` is the calendar baseline. `0012_dashboard_invoice_flow` adds the verification ledger, separate invoice/application state, document links and submitted-agreement protection. Existing accounts, membership records and prices are preserved.

Both additive migrations were applied to the configured database in this phase. The existing Sandbox webhook endpoint now subscribes to the invoice and verification/refund events without changing its signing secret. Application source changes still require deployment.

Guarded schema and webhook tools support read-only preflight by default and accept `--apply`:

```powershell
railway.cmd run --service sanbayfusion-hotel --environment production --no-local -- node scripts/with-railway-database.mjs scripts/migrate-dashboard-invoices.ts
railway.cmd run --service sanbayfusion-hotel --environment production --no-local -- node --import tsx scripts/configure-invoice-webhooks.ts
```

The Railway environment is named `production`, but these tools require Stripe test keys, the expected project, and test-mode objects. They never access Live Stripe data.

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
railway.cmd run --service sanbayfusion-hotel --environment production --no-local -- node scripts/verify-invoice-sandbox.mjs
```

The new Sandbox suite uses real Stripe payments/refunds/invoices, an isolated PGlite database running the full PostgreSQL migration chain, and Stripe CLI forwarding actual signed events to the production webhook handler. It covers customer reuse, multiple verified cards, failure/ownership checks, immutable profile/cart review, submission retries, invoice recovery after interruption, exact totals, no automatic collection, decline safety, successful payment activation, duplicate events, rejection of out-of-band payment, selected-month entitlements, and the responsive Dashboard/3DS browser journey. Fixture emails are disabled. Test objects remain in Sandbox for inspection; evidence and screenshots are written under `.next/verification/`.
