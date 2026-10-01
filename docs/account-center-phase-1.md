# Customer Account Center - Phase 1

Routes: `/dashboard`, `/dashboard/personal`, `/dashboard/addresses`,
`/dashboard/payment-methods`, `/dashboard/security`, `/dashboard/membership`,
and `/dashboard/payments`.

All pages require the existing server-side account session. Mutations use
`/api/account` and derive the owner from that session; submitted account IDs
are ignored. Protected navigation preserves the requested account destination.
Client components receive explicit safe DTOs, never password hashes or TOTP
storage records. `currentCustomer()` now returns only public profile fields.

The existing account ID remains the identity. Addresses, security state, email
change requests, attempt limits and audit events are additive tables. Display
name is an optional field on the existing account. Membership and payment
sections read existing records by account ID, not a browser email or owner ID.
Historical records without an account foreign key are read only when their
Stripe Customer matches the account's existing server-owned mapping. Email alone
is never used to claim a historical membership. Other unlinked records require
an audited existing-account link.

International billing and Thailand delivery addresses have independent default
selection. A partial unique index and serialized writes enforce one default per
address type. Removing a default selects another existing address when possible.
`accountDefaults(accountId)` exposes profile and defaults for a future checkout
integration; this phase does not wire it into membership applications.

Saved cards use the existing Stripe Sandbox Customer mapping, or recover a
single mapping from account-owned membership records before creating a customer.
SetupIntent and embedded Stripe Elements save multiple cards without a charge.
Stripe's customer invoice-settings field is the authoritative default card.
Every card mutation checks ownership. Removal selects a replacement default
before detaching the old card. Cards referenced by unfinished membership
applications cannot be detached through account management. Raw PAN/CVC never
passes through the account API or database.

Email change requires the current password and, if enabled, a second factor.
The new email must receive a random, single-use, 30-minute confirmation token;
only its hash is stored. Confirmation requires the original authenticated account.
Account and Stripe Customer IDs remain unchanged. Account-owned membership
contact email is updated for existing lookup compatibility; historical purchase
and application snapshots are not rewritten. Sessions rotate on confirmation.

TOTP uses OTPAuth with six digits, SHA-1, a 30-second period and a one-step clock
window. Enrollment requires password reauthentication and a verified code.
Secrets are encrypted with AES-256-GCM using ACCOUNT_SECURITY_KEY and account ID
as authenticated context. Replayed time steps are rejected. Ten random recovery
codes are shown once and stored only as hashes; each is consumed under a lock.
Sign-in enforces the second factor. Password/2FA changes revoke existing sessions
and issue a fresh current session. Database-backed attempt limits cover login,
reauthentication, enrollment, email changes, and account mutations.

Configuration and operations:

- Stripe remains TEST/SANDBOX only. No application-fee or refund logic was added.
- `ACCOUNT_SECURITY_KEY` is a dedicated 32-byte hexadecimal encryption key,
  stored directly in the existing Railway service. Keep it stable and backed up
  securely; changing it invalidates existing encrypted authenticator secrets.
- Email delivery needs the existing `RESEND_API_KEY` and verified
  `RESERVATION_FROM_EMAIL` in Railway. They were missing during implementation.
  Email-change requests fail closed when sending is unavailable; no email is
  silently replaced. Mail delivery itself could not be verified without them.
- Migration `0010_colorful_wild_pack.sql` is additive. The reviewed
  `scripts/migrate-account-center.ts --apply` applies only this migration against
  the project's historical migration baseline. It does not reset or replay old
  migrations or rewrite existing customer/membership/payment data.
- Account Sandbox tests use the authorized Railway variables via
  `scripts/with-railway-database.mjs scripts/verify-account-center.mjs`.
  Test accounts and account data are enclosed in database transactions that roll
  back. Real Sandbox Customer/SetupIntent objects remain as verification evidence.
  Verification email is captured in the test double, never sent to real recipients.
- Browser tests exercise the actual account components/API with real Stripe
  Elements and transaction-scoped authenticated test sessions, at desktop,
  tablet and mobile sizes. A separate production-server test verifies logged-out
  redirects and mutation rejection. Screenshots are ignored `.next/verification`
  artifacts. Set PLAYWRIGHT_CHROMIUM_EXECUTABLE for a non-default browser path.

No website deployment is performed by these verification scripts. The previously
unfinished membership-specific 3DS test is outside this phase and remains deferred.
