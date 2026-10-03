# Sanbay Fusion transactional email

Configured through the authenticated Resend MCP on 2 October 2026. All 25 templates are published: 22 customer categories and three staff notices. No MX records were changed; iCloud remains the receiving provider and Resend Receiving remains disabled.

## Senders and event mapping

Every address uses the display name `Sanbay Fusion`. Sender selection is centralized in `lib/email/senders.ts`.

| Template alias | Sender | Application event |
| --- | --- | --- |
| `sanbay-welcome` | account@ | Customer account inserted successfully |
| `sanbay-password-reset` | account@ | Forgot-password action generates a one-hour reset token |
| `sanbay-password-changed` | account@ | Password hash changes, through reset or Account Center |
| `sanbay-email-verification` | account@ | Reauthenticated email-change request; 30-minute confirmation link |
| `sanbay-email-changed` | account@ | Verified address replacement commits; sent to both previous and new addresses |
| `sanbay-security` | account@ | 2FA enabled, disabled, or a recovery code consumed |
| `sanbay-account-notice` | account@ | Payment method verified/removed/default changed, email change requested, membership payment needs action/fails, or membership cancellation changes |
| `sanbay-membership-received` | support@ | Application enters pending review after draft-invoice preparation |
| `sanbay-membership-under-review` | support@ | Application enters the review queue; does not claim a staff member has opened it |
| `sanbay-membership-review` | support@ | Same submission, addressed to the staff inbox |
| `sanbay-membership-approved` | support@ | Approval is recorded, before payment collection |
| `sanbay-membership-declined` | support@ | Application becomes declined/rejected |
| `sanbay-membership-paid` | support@ | Verified payment changes the stored invoice state to paid |
| `sanbay-membership-active` | support@ | Paid, approved membership is activated |
| `sanbay-membership-id` | support@ | Membership ID is first issued |
| `sanbay-membership-expiry-reminder` | support@ | Ongoing paid agreement is within seven days of its saved final expiry |
| `sanbay-membership-expired` | support@ | Saved expiry is reached, or status changes to expired |
| `sanbay-meal-scheduled` | support@ | Standard Meal delivery date/time is first saved or changed, including activation schedules |
| `sanbay-delivery-reminder` | support@ | Tomorrow's scheduled Standard Meal or legacy prepaid package delivery, Bangkok time |
| `sanbay-order-confirmation` | support@ | Order is confirmed and paid, including an order fully covered by the meal allowance |
| `sanbay-order-update` | support@ | Order/payment status changes, Standard Meal fulfillment, or legacy package delivery status changes |
| `sanbay-meeting-received` | reservation@ | Reservation/meeting/private-event request is saved; explicitly not a confirmed booking |
| `sanbay-meeting-staff` | reservation@ | Same request, addressed to the staff inbox |
| `sanbay-contact-received` | support@ | Validated support enquiry is durably queued |
| `sanbay-contact-staff` | support@ | Same enquiry, with customer reply-to for staff |

The staff inbox is `support@sanbayfusion.com`. Order status notifications reflect the existing application's actual states; they do not invent a courier or dispatch integration.

## Delivery architecture

`lib/email/managed-templates.ts` is the shared source for the application renderer and matching Resend dashboard templates. HTML escapes customer content; every email has a plain-text alternative. Dashboard-only edits do not change runtime content: reconcile them into this source and sync before deploying.

The current logo is derived from `public/brand/sanbayfusion-logo.png`. Actual outgoing messages embed an optimized PNG using an inline CID attachment. This avoids the HTTP 403 challenge observed on automated public-site image requests. The stored dashboard templates retain the public absolute logo URL; their image preview may depend on the site's bot protection. No website security settings were weakened.

Migration `0014_transactional_email_outbox.sql` adds an outbox and eight database triggers. Events are inserted in the same transaction as account, security, membership, order, meal, delivery and reservation changes. Rollbacks discard notifications. Only display fields are copied; password hashes, reset tokens, TOTP secrets, recovery hashes and card details are excluded.

Contact acknowledgement and staff delivery are queued together. Password-reset and email-verification links are sent immediately through the existing Resend SDK; token-bearing messages are not retained in the outbox. Password reset now awaits provider acceptance and defaults to the production URL rather than localhost.

`scripts/start.mjs` supervises Next.js and an email worker inside the existing Railway service. No extra paid service, public cron endpoint, or Receiving feature is needed. The worker checks reminders and the queue every 15 seconds, with database row locks for overlapping deployments/replicas. Delivery begins after the business transaction commits.

Membership reminder dates use the saved exclusive expiry at 00:00 Asia/Bangkok. Unselected months between selected service months never count as expiry. The scheduler catches up expired notices for the current and previous Bangkok date only; it does not email years of historical records. Cancelled/rescheduled/fulfilled delivery reminders are cancelled before sending. Unpaid Standard Meal excess reservations are excluded from delivery reminders. The scheduler does not mutate membership entitlements or payment status.

Lifecycle event keys persistently prevent duplicate payment, activation and ID notices. The worker freezes message content, sender and inline logo before the first request, then retries with one stable Resend idempotency key. Up to ten attempts use backoff. Ambiguous retries stop before 23 hours because Resend's provider deduplication window is 24 hours. Failed rows remain for investigation; do not blindly reset them after that window. `sent` means provider acceptance, not proof that a human read an email. Delivery status is available through Resend MCP.

Worker logs contain queue counts, template names and outbox IDs, not email bodies, credentials or addresses. `scripts/verify-transactional-email.mts` checks senders, installed triggers and queue counts. Its opt-in `RUN_RESEND_SMOKE=true` inserts one idempotent test notification to the authorized `info@sanbayfusion.com` mailbox without creating customer/business records.

## Railway configuration

| Variable | Value / handling |
| --- | --- |
| `RESEND_API_KEY` | Existing Railway secret preserved; never committed or printed |
| `DATABASE_URL` | Existing Railway secret preserved |
| `ACCOUNT_FROM_EMAIL` | `Sanbay Fusion <account@sanbayfusion.com>` |
| `SUPPORT_FROM_EMAIL` | `Sanbay Fusion <support@sanbayfusion.com>` |
| `RESERVATION_FROM_EMAIL` | `Sanbay Fusion <reservation@sanbayfusion.com>` |
| `RESTAURANT_NOTIFY_EMAIL` | `support@sanbayfusion.com` |
| `NEXT_PUBLIC_SITE_URL` | Active application origin from deployment configuration; currently the temporary Railway production URL. |
| `EMAIL_WORKER_ENABLED` | `true` |

Resend MCP confirmed the domain, DKIM and SPF verified, sending enabled, Receiving disabled, and no existing webhooks. Observed account limits: 100 messages/day and 3,000/month. This implementation does not change the subscription or enable inbound processing.

## Template management and verification

Use the authenticated Resend MCP to inspect current templates first. `scripts/prepare-resend-templates.mts` generates previews plus create/update and publish payloads. `RESEND_EXISTING_ALIASES` points to a fresh JSON alias list; `EMAIL_PREVIEW_DIR` can put evidence outside `.next`, which builds replace. Inspect dashboard changes before applying an update. No API secrets are used in generated payloads.

Validation covers transactional rollback, both email-change recipients, security-secret exclusion, 2FA events, membership payment/activation deduplication, paid-order confirmation, reservation acknowledgement, expiry timing, rescheduled reminders, concurrent queue claims, retry payload stability, and the provider idempotency cutoff. All 25 templates render without unresolved variables or old branding. Browser checks passed at 320, 390 and 760 pixels (75 layouts). These are browser layout checks, not a claim of testing every email client.

MCP request/results and previews are archived outside the build directory at `C:\Users\EliteHp\.codex\tmp\sanbay-transactional-email-20261002`. The sender tests are labelled TEST and create no bookings, accounts, memberships or payments.

References: [Resend MCP](https://resend.com/docs/mcp-server), [send email and inline attachments](https://resend.com/docs/api-reference/emails/send-email), [provider idempotency window](https://resend.com/docs/dashboard/emails/idempotency-keys).

## Real sender test results

All three MCP tests to `info@sanbayfusion.com` returned **delivered** when retrieved from Resend. This confirms provider delivery, not inbox placement or human reading.

| Sender | Resend message ID | Result |
| --- | --- | --- |
| `account@sanbayfusion.com` | `01a0fa5a-e461-7755-9835-45e69e1ffdd2` | Delivered |
| `support@sanbayfusion.com` | `01a0fa5a-e8b2-726f-9120-d1a0a25278a4` | Delivered |
| `reservation@sanbayfusion.com` | `01a0fa5a-ed0f-7537-9e82-dff45d0dde66` | Delivered |

All 25 published HTML and plain-text bodies were retrieved through MCP and exactly matched the prepared source; sender assignments were verified. The full local suite passed 242 tests with 16 opt-in skips. A further migration-order regression test passed, bringing current tested coverage to 243 tests. The focused email suite and optimized production build also passed after inline-logo support was added.

## Production verification

Railway deployment `8e46b4af-9b35-46a2-a450-12390c99a27e` succeeded. Migration 0014 is applied and all eight email triggers were verified inside the deployed container. The worker processed the authorized test outbox row in one attempt; Resend MCP confirmed message `01a0fa63-1a65-733c-86cc-0a8ad2270559` delivered to `info@sanbayfusion.com`. No failed or pending rows remained in that final check.

The deployment checks exposed that the live service was not using the migration command from the local Railway file. The migration was applied through the deployed application's standard `npm run db:migrate` command. Railway's service configuration now explicitly stores that pre-deploy command, a 120-second migration timeout, and the `/` healthcheck with a 100-second timeout; the saved values were retrieved and verified through its API. The new migration timestamp follows the existing journal's largest timestamp, with regression coverage to prevent skipped migrations.

The final DNS check still returned only `mx01.mail.icloud.com` and `mx02.mail.icloud.com` for MX. No Receiving, MX, subscription, or website protection settings were modified.
