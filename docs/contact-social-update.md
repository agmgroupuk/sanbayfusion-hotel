# Official contact and social update

2 October 2026. Central source: `lib/site.ts`.

- Manager: Suchada Burandech.
- Phone: +66 80 897 2129; functional telephone link uses +66808972129.
- General email remains info@sanbayfusion.com. Account, support and reservation sender addresses retain their existing purposes and Railway overrides.
- Shared contact assistance added to About, How It Works, membership final review and received/payment confirmation pages. Contact and Events include the manager at their personal contact point. The footer provides contact details throughout the site without adding the manager to every page's body.
- Gold, locally hosted social icons have accessible names, keyboard focus, 48px targets and reduced-motion-aware hover treatment. Email uses PNG variants with alt text rather than external icon services or SVG.
- All managed transactional templates consume the shared email footer in HTML and plain text. Security templates omit the manager and social links; legacy customer meeting/membership templates also use the shared business footer. No real emails were sent for this update.

## Profile checks

| Platform | Destination | Verification / use |
| --- | --- | --- |
| Facebook | https://facebook.com/sanbayfusion | Browser HTTP 200; title **Sanbay Fusion Foods Company Limited · Yan Nawa** (separator may vary). Included in links and schema `sameAs`. |
| Instagram | https://instagram.com/sanbayfusion | Browser HTTP 200; profile **Sanbay Fusion (@sanbayfusion)**, with a sanbayfusion.com website reference. Included in links and `sameAs`. |
| TikTok | https://tiktok.com/@sanbayfusion | Exact official profile URL subsequently confirmed by the owner and included in links and schema `sameAs`. Independent browser inspection returned a generic TikTok page; account data did not identify the user (status 10221), so browser verification is not claimed. |
| LINE | Not supplied | No existing confirmed direct link. Icon/configuration prepared; website icon is non-interactive with an accessible unavailable label. Omitted from email links and `sameAs`. |
| WhatsApp | Not supplied | No existing confirmed direct link. No username URL or phone-number URL inferred. Same pending treatment as LINE. |

Only owner-confirmed public identity URLs enter `sameAs`. The owner explicitly supplied all three Facebook, Instagram and TikTok URLs during this task. LINE ID and WhatsApp username are displayed as **sanbayfusion**, never as the telephone number; these usernames do not supply the missing platform-generated direct URLs. Add confirmed LINE/WhatsApp destinations to the central configuration; no component copies are required. After a public identity is verified, update its verification flag as appropriate. Contact chat links need not be added to `sameAs` unless they identify the official entity.

Instagram's public biography still uses the old "membership-based food and beverage service" description. This is an external account biography, not website metadata. It was not edited as part of this website/email update.

The audit found no old business phone/social URLs or Maula/Mola references in customer-facing code. Example customer phone numbers in form placeholders are user-input examples, not company contact details. A legacy customer meeting email's old "Bar & Restaurant · City" heading was replaced with the official company name.

Icons: Simple Icons, CC0, with Sanbay gold coloring. Asset attribution is stored with the files.

## Validation

- Typecheck and changed-file lint passed.
- 26 email, outbox, SEO and contact-footer tests passed, including security-email exclusions and omission of unconfirmed messaging links.
- The application renders its transactional email HTML from the shared source before handing messages to Resend. Updating this source changes actual outgoing email content; standalone stored Resend dashboard copies are not the delivery source.

- Final production build passed after the owner's exact URL/username confirmation. The targeted seven email-footer/security tests passed again.
- 74 browser checks passed at 390, 768 and 1440 pixels, including icon destinations, loaded assets, keyboard focus, pending-icon accessibility, direct assistance links and no horizontal overflow. Website footer and mobile service/security email previews were visually reviewed.
- All 25 managed email previews were regenerated offline; no real emails were sent.

## Deployment

Railway production deployment **de24c41a-f224-495f-8623-fde18b2e252c** succeeded on 2 October 2026. Production-runtime rendering checks passed for all **25 managed templates**, including **6 security templates** with no social/manager content. No emails were sent.

Post-deployment public-domain checks passed through Cloudflare for the homepage, Contact, About, Events and How It Works, confirming the manager, telephone, exact social URLs and three owner-confirmed sameAs entries. All ten SVG/PNG social assets returned HTTP 200.
