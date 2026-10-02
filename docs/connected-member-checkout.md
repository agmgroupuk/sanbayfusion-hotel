# Connected member checkout

## Existing systems reused

The central account/session tables, Account Center addresses, verified saved-card list and Stripe Customer lock, membership approval/invoice/activation workflow, selected-service-month rules, product catalogue, order/item tables, payment webhook and transactional email outbox remain the sources of truth. No new account system, database or Stripe Customer creation path was introduced.

## Changes and routes

- `/dashboard`: active-member Place Your Order action; explicit disabled explanation otherwise.
- `/dashboard/order`: existing member catalogue, filtered by plan permissions and excluding alcohol from this payment flow; quantity controls capped at 50.
- `/dashboard/checkout`: delivery, saved card and review/payment steps. Existing included Standard Meal flow retained.
- `/dashboard/orders`: central order/payment history, upcoming delivery details and resume links.
- `/api/orders/payment-intent`: authenticated, server-priced, scheduled additional-order preparation using the existing Stripe Customer and verified saved card.
- `/api/orders/confirm`: server verification; never trusts browser success.
- `/api/orders/cancel`: owner-only cancellation of an unpaid additional-order attempt before editing/retrying.
- `/api/stripe/webhook`: current Stripe state reconciliation for additional-order payment events.

Additional-order snapshots have `kind: additional_order`, separate from membership applications and Standard Meal redemptions. They retain the chosen address snapshot, delivery date/time, Stripe Customer/PaymentMethod references and immutable cart fingerprint. Existing order-item rows store authoritative prices. Sensitive card data never enters this flow.

## Subdomains and shared identity

| Host | Entry route |
| --- | --- |
| account.sanbayfusion.com | /dashboard |
| pay.sanbayfusion.com | /membership/checkout |
| checkout.sanbayfusion.com | /dashboard/order |

All hosts serve the same Railway application and database. Production sessions use an HttpOnly, Secure, SameSite=Lax `__Secure-sbf_platform_session` cookie scoped to sanbayfusion.com. Existing host-only sessions are promoted on protected navigation; database expiry/revocation remains authoritative. Sign-out revokes both session references. Membership selection uses a shared HttpOnly cookie and is revalidated/repriced server-side. The three HTTPS origins are explicitly allowlisted; arbitrary subdomains are not. API requests remain same-origin, without wildcard CORS. Sign-in return destinations remain validated relative account/membership routes. No CSP exceptions were added. Saved-card confirmation uses Stripe.js authentication without a success-URL fulfillment shortcut.

`NEXT_PUBLIC_CONNECTED_SUBDOMAINS` defaults to false. Set it to true and rebuild only after all three names resolve and have valid TLS. Until then the complete checkout stays available on the existing main-domain paths.

## Authorization, schedule and payment

- The authenticated account must own an active paid membership for both the current month and the delivery service period. Inactive, expired, cancelled and unselected months are rejected server-side.
- Bangkok calendar-day rule: any time on October 7 allows October 10; at Bangkok midnight the minimum moves to October 11. This is not a rolling 72-hour requirement. Reuses the existing three-day helper and 11:00–24:00 half-hour service slots (24:00 closes the selected service day).
- Only complete owned Bangkok delivery addresses and verified owned saved cards qualify. Default card is preselected; another verified card can be selected.
- A durable attempt UUID plus Stripe idempotency key prevents duplicate orders/payments on retries. Refresh resumes the same attempt. The server ignores supplied prices/totals and reprices real catalogue products; alcohol is always excluded from Stripe orders regardless of public catalogue flags.
- Stripe.js confirms the saved card and handles issuer authentication. Failed/action-required payments do not confirm orders. The customer can cancel an unpaid attempt before changing it.
- Signed webhooks reread Stripe state. Conditional paid transitions and existing outbox event keys prevent duplicate confirmation and email. Confirmation also verifies amount, currency, account, Customer and PaymentMethod against the saved order.
- If payment succeeds after membership/scheduling eligibility changes, money received is recorded but fulfillment remains unconfirmed for staff review. Staff must resolve these exceptions through the existing support/Stripe operations process; automatic refunds are not implemented.
- PaymentIntent reference stays in the existing order column; successful additional orders also retain the charge reference in their snapshot. The existing invoices/payments view includes these orders. No separate Stripe invoice is created for additional orders.

## Railway / DNS blocker

Railway accepted account.sanbayfusion.com on the existing service, port 8080. Creating pay.sanbayfusion.com was rejected: **custom-domain limit reached for this service/plan**. checkout.sanbayfusion.com cannot be activated under that same limit. A hosting plan/domain-limit change is required; no billing plan was changed automatically.

Exact returned DNS records for the registered account host:

| Type | Name | Value |
| --- | --- | --- |
| CNAME | account | ro079apb.up.railway.app |
| TXT | _railway-verify.account | railway-verify=2b9a0bae12e4a37427e15e1130e968c57949781e09b999dce57653908d3a9b68 |

Account DNS/TLS is still pending. Targets for pay/checkout must be obtained after Railway permits registering those domains; do not invent them or reuse a target without checking. Do not modify mail/MX records. Stripe remains Sandbox-only. Existing Railway Stripe, webhook and email secrets are configured; no replacement keys are needed.

## Validation and limits

Isolated Postgres tests cover authoritative pricing, default/alternate cards, foreign/unverified cards and addresses, empty/invalid carts and quantities, eligibility, delivery cutoff/timezone boundaries, failed/action-required payments, paid exceptions, retries, duplicate confirmation and outbox delivery deduplication. Existing membership, Standard Meal and sign-in tests remain in place. Browser harness exercises the actual checkout at 390/768/1440 pixels, default/alternate card selection, payment failure, refresh/retry and confirmation.

The browser harness mocks Stripe; it is not a real issuer 3DS end-to-end test. Public three-host TLS/session navigation cannot be verified until the Railway/DNS blocker is resolved. These external checks must remain pending rather than be reported as passed.

## Release result

- Railway deployment `a176ebfe-1a3b-422f-bd23-960bc98be605`: **SUCCESS**. Main-domain checkout is deployed; subdomain switching remains disabled.
- 334 tests passed across the full run and focused reruns after correcting cookie test doubles; 16 opt-in external tests skipped. TypeScript and production build passed; lint has zero errors and four existing warnings.
- 24 actual-component browser assertions passed at three viewport sizes; mobile review layout also inspected visually.
- Real Stripe Sandbox provider probe: saved default Visa and alternate Mastercard succeeded, decline returned `card_declined`, authentication-required card returned `requires_action`, retry reused the same PaymentIntent. Fixture payments were refunded, other intents cancelled and the fixture customer deleted. No application accounts or email recipients were created by this provider probe. See `scripts/verify-checkout-stripe-sandbox.cjs` and [Stripe's official test-method documentation](https://docs.stripe.com/testing?testing-method=payment-methods).
- Existing Sandbox webhook subscription was extended with `payment_intent.processing` and `payment_intent.canceled`, preserving its existing events and signing secret.
- Deployed public checks: all three protected order pages redirect to sign-in with the correct return path; all three order mutation endpoints reject anonymous requests with 401; an invalid webhook signature returns 400. Existing-session promotion returns the shared Domain/Secure/HttpOnly/SameSite cookie flags.
- Deployed local Host-header checks verify each of the three exact subdomain root mappings. This verifies application routing only, not public DNS/TLS or three-domain end-to-end login.

Remaining owner action: increase Railway's per-service custom-domain allowance to at least four (main domain plus the three requested hosts), then complete the DNS records above. Register pay/checkout after that allowance is available, obtain their actual DNS values, verify TLS, then enable the connected-subdomain environment flag and rebuild. Full browser 3DS completion remains a separate final end-to-end check.
