# Private Events & Bespoke Hospitality

Updated 2 October 2026. Scope is the Events page, enquiry presentation and related informational copy; membership purchasing, catalogue products, Stripe and Google Maps configuration are unchanged.

## Experience

- Editorial photographic hero, black/gold styling, ten occasion types, advance planning for international visitors, seven-step event builder, three-step proposal process, bespoke pricing factors and official direct contact.
- Real selections populate Your Event Brief. Desktop uses a sticky sidebar; mobile/tablet use a collapsible summary. No example event, date, guest count, service tier or menu is preselected.
- The seven steps cover occasion, location, dining, beverages, entertainment, additional requests and contact details. Previous/Continue preserves in-memory selections, validates required fields and moves keyboard focus to the new heading. Refreshing the page does not persist the draft.
- Event date/time is explicitly Thailand time. Customer-selected guest counts support 1–500; larger events and uncertain dates are directed to personal contact. Venue/area is sufficient for an initial enquiry.
- The beverage choices are limited to refreshments currently offered on the website. The brief contains no beverage-enquiry option outside those choices, and the event action does not create a booking or payment.
- Submission and confirmation explicitly describe an enquiry, not a confirmed booking, availability guarantee, final quotation or payment.

## Existing delivery system

`requestEventProposal` validates a structured brief with `lib/events.ts`, formats it into the existing enquiry message and calls `queueContact`. Staff notification and customer acknowledgement use the existing durable outbox, templates and configured senders. No real test emails were sent during verification.

The old builder used the general Contact action, whose 2,000-character message limit was too small for a complete detailed event brief. The event-specific action applies bounded fields and enum allowlists, then sends the complete formatted brief through the same queue. Free-text event fields reject references to discontinued catalogue offerings. Unknown fields, product prices and payment metadata are rejected. There is no new booking or payment record.

A queued brief receives the existing acknowledgement. Missing delivery configuration or queue failures return an error and retain the customer's form data; the UI no longer claims a successful send when nothing was queued. The queue's existing five-minute deduplication remains in place.

## Content consistency

About, How It Works, FAQ and Contact now describe a separate private hospitality enquiry service with tailored proposals. Terms distinguish event proposals and separately agreed event terms from membership purchases. Privacy names event/travel dates supplied by customers, venue, dietary information, discussion preferences, entertainment and preferred contact method. Existing navigation/footer links continue to point to `/events` as Private Events.

This service is suitable for international visitors, private groups, families and business travellers. The membership-only eligibility restriction is not applied to event enquiries.

## Verification

- TypeScript and changed-file lint passed.
- Event action/schema tests cover retired-product requests, injected payment data, maximum-length briefs and unavailable/failed delivery.
- `scripts/verify-event-builder.mjs` mounts the real builder with an offline action stub, exercising navigation, state, validation, summaries, submission payload, errors and success at mobile, tablet and desktop widths without sending email.

- Production build passed. Offline browser flow: 57 checks passed across 390/768/1440px. Full-page and related-page checks: 24 passed with no browser errors or horizontal overflow. Desktop/mobile visuals reviewed.

- The hero uses a pre-optimized 1920px WebP (191 KB) from the existing dining photograph, served directly to avoid slow first-request AVIF conversion observed during desktop verification.

## Deployment

Railway production deployment b227a302-27ed-4025-b34f-55367cc1d2a4 completed successfully on 2 October 2026. Direct checks inside the production runtime returned HTTP 200 for Events and the six related informational pages. Final runtime checks confirmed the new title, live brief markup and direct WebP hero (HTTP 200, image/webp, 190944 bytes). The final local production build and browser image-load check passed.

An automated request to the public sanbayfusion.com/events URL received HTTP 403; public-edge verification was therefore limited. No edge/security configuration was changed.
