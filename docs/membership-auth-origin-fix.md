# Membership authentication and origin correction

Continue to Application now checks the server session in the cart-saving endpoint before choosing a destination. Guests receive `/signin?next=%2Fmembership%2Fcheckout`; authenticated customers receive `/membership/checkout`. The browser accepts only those two destinations. Saving a cart never creates an application or invoice.

The existing compressed, chunked HttpOnly cookie preserves the complete supported configuration for 24 hours: plan reference, selected year/months, purchase mode, delivery preferences, food preferences, products, add-ons and quantities. Its production flags remain Secure and SameSite=Lax. Session storage is only an editing convenience; disabled browser storage no longer prevents continuation. Prices and totals are never accepted from browser storage: configuration validation, checkout and application preparation calculate them from the server catalogue.

Sign In and Sign Up share a return-path validator with the authentication actions. It permits normalized internal dashboard, membership and staff paths and rejects external destinations, malformed paths and encoded path separators. Existing authenticated sessions also follow the validated destination instead of always going to Dashboard. The existing authenticated review checks personal information, default billing/delivery addresses, a verified saved card and a verified default card before application creation.

## Origin investigation

The old API check compared `Origin` with `new URL(request.url).origin`. That comparison fails when a public HTTPS request reaches Next.js through a proxy using an internal HTTP host/port. It ran before session lookup on the selection endpoint. The same comparison was also present in application, account and benefit mutations.

Those four endpoints now validate against exact deployment-configured public origins, independently of authentication. They do not trust incoming Host or X-Forwarded-Host headers to expand the allowlist. Cross-site browser requests are rejected; existing non-browser requests without Origin remain supported. Genuine invalid origins still return HTTP 403 with `UNTRUSTED_ORIGIN` and a customer-facing retry message.

The allowlist uses only the exact `NEXT_PUBLIC_SITE_URL` origin. Local request origins are accepted only on loopback hosts outside production. Neither `RAILWAY_PUBLIC_DOMAIN` nor incoming host/forwarding headers expand the allowlist. Sign-in Server Actions use the same exact configured host via Next.js's [documented proxy configuration](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions#allowedorigins); Next.js CSRF checks remain enabled.

The earlier Railway inspection in this historical incident found the old custom domain in Railway's host variable. The current temporary production origin is explicitly configured through `NEXT_PUBLIC_SITE_URL`; stale Railway-managed host values are ignored. Authentication/session cookies are host-only, and there are no old-domain redirects.

## Verification

- 194 tests passed; 16 opt-in external-service tests skipped.
- New isolated Postgres integration tests execute real password verification, session creation, sign-in return, cart recovery and account review. They verify no guest application creation, authoritative THB 18,840 pricing despite submitted fake prices, all five missing account requirements, expired sessions, failed sign-in, existing sessions and hostile origins.
- Origin/redirect tests cover Railway's internal URL, exact deployment domains, forged proxy headers, cross-site requests, null/malformed origins, open redirects and encoded separators.
- TypeScript passed. ESLint passed with five existing warnings unrelated to this change.
- Production build passed. The local browser build used `NEXT_PUBLIC_SITE_URL=http://localhost:3102`; deployment must rebuild with the public production configuration.
- Playwright passed against the production build at desktop (1440px), tablet (768px) and mobile (390px). It verifies guest continuation requests neither the application page nor application API before Sign In, preserves the checkout return path through Sign Up, and retains non-consecutive year/month selections and product quantities. Existing plan dialogs, pricing, active-member blocking and layout checks also passed.

This change requires rebuilding and deploying the application. It does not change database schemas, Stripe configuration or existing customer records.
