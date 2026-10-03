# Sanbay Fusion payment-domain architecture

## Hosts

- `https://sanbayfusion.com` is the canonical public website and customer account host.
- `https://pay.sanbayfusion.com` is the single host for customer-facing Stripe and payment interfaces. It uses the existing Railway application and database.

Payment page routing is controlled by `NEXT_PUBLIC_PAYMENT_HOST_ENABLED`. It is enabled in production after verifying host redirects, shared sessions, payment return paths, and the Sandbox webhook. `.env.example` keeps it `false` for local development unless the developer is testing the pay host.

## Customer route mapping

| Flow | Main-domain entry | Payment-host interface |
| --- | --- | --- |
| Membership selection | `/plans` and plan pages | `/membership/checkout` for application and payment preparation |
| Approved membership payment/recovery | Dashboard membership status | `/membership/payment` |
| Membership payment result | Main-domain fallback | `/membership/success`, `/membership/payment-failed`, `/membership/thank-you` |
| Saved payment methods | Dashboard link | `/dashboard/payment-methods` |
| Additional member order | `/dashboard/order` for menu and scheduling | `/dashboard/checkout` for checkout and payment |
| Order history and account details | `/dashboard/*` | Redirects back to the main host when entered from the payment host |

The app, account, membership, and order workflows remain separate. They continue using the same session database, account-to-Stripe-Customer mapping, eligibility checks, pricing, order records, and idempotency controls.

## Session and origin security

The existing `HttpOnly`, `Secure` production cookie is scoped to `sanbayfusion.com`, so it is shared only by the apex website and its payment subdomain. Database expiry and revocation remain authoritative. API origin checks and Server Action `allowedOrigins` include only the explicit public website, payment host, and exact Railway service domain.

## Stripe Sandbox webhook

The existing webhook implementation remains at `/api/stripe/webhook`. The only active Sandbox endpoint is `https://pay.sanbayfusion.com/api/stripe/webhook` (`we_1UMPlQEfllgi0bMkIbMMZJr`, API version `2026-08-26.dahlia`). It subscribes to the same 15 events as the former main-host endpoint: `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.requires_action`, `payment_intent.processing`, `payment_intent.canceled`, `refund.created`, `refund.updated`, `refund.failed`, `invoice.finalized`, `invoice.updated`, `invoice.paid`, `invoice.payment_succeeded`, `invoice.payment_failed`, `invoice.payment_action_required`, and `invoice.voided`.

The previous Sandbox endpoint (`we_1UJfL6Efllgi0bMk8hzX76Gr`, main-host URL) is disabled. Railway's `STRIPE_WEBHOOK_SECRET` contains only the pay endpoint's Sandbox secret; the value is not stored in this document. Live Mode was not modified. Verification used a harmless Sandbox `payment_intent.succeeded` event; Stripe reported `pending_webhooks: 0`, and direct valid/invalid signature requests to the pay endpoint returned HTTP 200/400 respectively.

When changing Railway variables, verify the resulting deployment source as well as the variable values. A variable-triggered deploy can use the repository-linked source rather than the local upload; deploy the verified workspace snapshot when needed, then recheck host routing and webhook verification.

## Railway domain status

Railway reports the `pay` CNAME's `currentValue` as blank and its DNS status as `REQUIRES_UPDATE`, although the domain is active, verified, has a valid complete TLS certificate, and the public pay host responds over HTTPS. No DNS or Cloudflare changes were made; investigate that status discrepancy before changing DNS.

The app continues rejecting Live Mode webhook events.
