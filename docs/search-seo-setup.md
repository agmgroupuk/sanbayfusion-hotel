# Google Search / SEO setup

Updated 2 October 2026.

## Website implementation

- `lib/site.ts` supplies the official company name, public URL, current logo, phone, email and Bangkok postal address.
- `lib/business-schema.ts` describes one entity with both `Organization` and `LocalBusiness` types and the stable ID `https://sanbayfusion.com/#organization`. A linked `WebSite` identifies Sanbay Fusion as the site name. The server-rendered site layout emits one safely serialized JSON-LD graph.
- Preferred organization/local-business logo: **https://sanbayfusion.com/brand/sanbayfusion-logo.png**, a 1774 × 887 PNG of the current logo. This is a direct public asset, not an image optimizer or expiring URL.
- No unverified Maps listing, coordinates, social profile, opening hours, rating or review is fabricated. The membership-only eligibility restriction is not applied to private events.
- `lib/seo.ts` is the public metadata inventory: page-specific titles, descriptions, canonical URLs, Open Graph and Twitter metadata. The 12 plan detail pages use their own canonical URLs and current authoritative plan descriptions/prices. `/join` consolidates into `/plans`; it is excluded from the sitemap.
- The sitemap includes 19 canonical public pages and 12 plans. It excludes account, checkout, administration and duplicate plan-chooser URLs and does not invent fresh modification dates on each build.
- Robots advertises the sitemap, permits public content and branding, and excludes private application/account/administration routes.
- Favicon, PNG icon, Apple icon, legacy aliases, manifest and social-image endpoints retain the current Sanbay logo. Existing cache-revalidation headers and content-versioned icon metadata are preserved.
- No Analytics, Google Tag Manager, Google Maps, Business Profile, DNS or MX changes.

## Validation

- Production build and changed-file lint passed.
- Seven SEO tests passed: official identity, safe JSON-LD serialization, canonical/social consistency, visitor positioning, plan URLs, sitemap scope and robots.
- `scripts/verify-seo.mjs`: **31 pages, 475 checks passed** against the local production build.
- `scripts/verify-brand-icons.mjs`: **23 branding responses passed**, including exact asset hashes, old cache-query aliases, manifest entries, icon metadata and 1200 × 630 share images. Current logo and share-card visuals inspected.
- The actual JSON-LD was submitted to **https://validator.schema.org/** using code input: **0 errors, 0 warnings**, including the linked Organization/LocalBusiness, ImageObject, address and contact point.
- Google's Rich Results Test was attempted with both code and the homepage URL. It returned **“Something went wrong — Log in and try again”**. This is an access limitation, not a successful Google validation result.
- Public-domain checks from the local development connection received Cloudflare HTTP 403, including a browser request. A second-network check from Railway fetched the public HTTPS homepage, robots.txt and permanent logo through Cloudflare successfully (HTTP 200). The block therefore does not affect every client. This does not establish Googlebot crawl status; Search Console live inspection is still required.

## Search Console access still required

There is no authenticated Search Console session or integration available in this environment. Opening a browser for Google sign-in was rejected by automatic approval review with “blocked by policy”.

The user needs to open https://search.google.com/search-console and select an existing property or add URL-prefix property **https://sanbayfusion.com/**. If HTML verification is offered, supply only the `content` value from Google's verification tag. The application supports **GOOGLE_SITE_VERIFICATION** in Railway; set that value, redeploy and complete Google's Verify action. No password or Analytics/GTM installation is needed. If the domain is already verified through DNS, preserve that method instead of adding another token.

After authenticated access and ownership are confirmed:

1. Submit **https://sanbayfusion.com/sitemap.xml** in the property's Sitemaps screen.
2. Inspect and run the live test on **https://sanbayfusion.com/**. Confirm Google can fetch the page, preferred logo, icons and sitemap through Cloudflare before claiming crawlability.
3. Request indexing for `/`, `/plans`, `/how-it-works`, `/about`, `/events`, `/faq` and `/contact`; inspect the 12 canonical plan URLs through the sitemap.
4. Re-run Google's Rich Results Test. Fix relevant critical issues; do not invent business facts merely to silence optional-property warnings.
5. If Google itself receives 403, review the specific Cloudflare security event/rule with authorized Cloudflare access and correct its verified-crawler handling. Do not broadly disable origin, CSRF, firewall or account protections.

These Google-side actions have **not** been completed. The URL Inspection API reports indexing status; it is not a general request-indexing endpoint. Do not use Google's restricted Indexing API for ordinary membership/business pages or obsolete sitemap-ping URLs. Google decides when to recrawl and which logo/snippet to display.

References: [Organization](https://developers.google.com/search/docs/appearance/structured-data/organization), [LocalBusiness](https://developers.google.com/search/docs/appearance/structured-data/local-business), [recrawl requests](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl), [URL Inspection API](https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect).

## Production deployment

Railway deployment **5cee4296-af1d-4cf8-961e-da00cc327d60** completed successfully on 2 October 2026. The SEO verifier then ran from Railway against **https://sanbayfusion.com** through Cloudflare: **31 pages and 475 checks passed**. This verifies the public host, not only the internal application server. Search Console account actions and Google Rich Results authentication remain pending as described above.

The branding verifier also passed **all 23 responses against the public HTTPS domain** after deployment, including favicon/PNG/Apple aliases, manifest, current logo metadata and both share images.
