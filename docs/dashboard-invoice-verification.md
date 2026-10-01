# Sandbox verification — 2 October 2026

The complete new Sandbox suite passed all **five scenarios**, using real Stripe test payments, refunds and invoices and actual signed events forwarded through Stripe CLI. Test account: `acct_1UJYS0Efllgi0bMk`. No Live keys or Live objects were used.

- Customer reuse, multiple cards, exact USD $2 verification/refunds, failed verification and ownership rejection.
- Exactly one THB 18,840 draft for a three-service-month membership plus twelve prepaid Tom Yum Goong units; submission and website approval made no membership charge. Staff-equivalent Stripe finalization/payment operations activated membership from signed webhooks. Replays preserved one Member ID and selected-month entitlements.
- Incomplete Dashboard information, incorrect service-month count, decline/delete safety and invalid webhook signatures.
- Recovery after invoice creation interrupted before line-item insertion; failed invoice payment and out-of-band paid marking did not activate membership.
- Browser journey at desktop/tablet/mobile sizes: completeness dialog, Dashboard return, Stripe-secured verification and refund, preserved months/cart, saved profile review, and a second issuer authentication challenge for the membership invoice. No card number or CVC reached Sanbay Fusion's API.

The ordinary suite passed **164 tests**. Typecheck and production build passed. Lint passed with five pre-existing warnings. Screenshots and event/object references are available in `.next/verification/`.

Database migrations 0011 and 0012 are applied. The existing Sandbox webhook subscription includes the required invoice and refund events. The source changes are not deployed. Resend and the staff email destination are not configured, so outbound email delivery was not exercised; pending applications appear in the admin review queue.

The automated test performed Stripe's supported finalization/payment API operations on the prepared invoice. It did not click staff controls inside Stripe Dashboard. The intended staff steps and Stripe's inability to enforce the website's approval flag against a Stripe administrator are documented in [the implementation guide](dashboard-membership-invoices.md).
