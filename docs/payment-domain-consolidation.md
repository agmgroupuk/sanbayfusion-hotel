# Temporary Railway production host

The existing application, database, membership/order flows and Stripe integration use one configured production origin:

`NEXT_PUBLIC_SITE_URL=https://sanbayfusion-hotel-production.up.railway.app`

The origin is centralized so the future domain migration requires changing deployment configuration rather than application routes. Membership review, application, food selection, saved payment methods, member ordering and checkout remain distinct workflows at same-origin paths.

## Sessions, origins and redirects

Production sessions and membership-selection cookies are host-only and secure; they are not scoped to a custom parent domain. API mutation origins and Server Action `allowedOrigins` use only the exact `NEXT_PUBLIC_SITE_URL` origin. Railway's `RAILWAY_PUBLIC_DOMAIN` is not an origin allowlist source. No middleware redirect targets the former custom website or payment hosts.

Payment return paths use the browser's current origin; server-generated password-reset, account-action and membership email links use `NEXT_PUBLIC_SITE_URL`. The same-origin webhook path remains `/api/stripe/webhook`.

## Temporary SEO handling

The Railway host is an application endpoint, not the permanent SEO identity. Leave `NEXT_PUBLIC_CANONICAL_URL` empty until the future public domain has been configured. With no canonical URL, public pages are marked `noindex`, structured business data and canonical alternates are omitted, and robots/sitemap do not publish the temporary Railway host as an indexing destination. Set the canonical variable only during the future domain migration.

## Stripe Sandbox

The current webhook handler is `/api/stripe/webhook`; its temporary Sandbox destination is `https://sanbayfusion-hotel-production.up.railway.app/api/stripe/webhook`. Stripe Live Mode is not part of this configuration. Store the endpoint signing secret in Railway's `STRIPE_WEBHOOK_SECRET`; do not put secrets in source or documentation.

When creating a new Sandbox destination, first keep the existing endpoint active, copy its event subscriptions, configure both signing secrets briefly, deploy and verify a real harmless Sandbox delivery plus valid/invalid signatures, then disable the old endpoint and retain only the new signing secret. Verify the deployment source after Railway variable changes; use a deployment of the reviewed workspace if an automatic deployment selected a stale repository commit.

Update `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CANONICAL_URL`, the Sandbox endpoint URL/secret, and transactional email template URLs when the future `.co.th` domain is ready.
