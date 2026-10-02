# Sanbay Fusion site icons

The source artwork is `public/brand/sanbayfusion-logo.png`, the current full logo
also used by the site's header and share cards. Site icons use its gold SF emblem
so the mark remains recognizable at small sizes. No generated icon uses the old
M monogram.

Regenerate committed assets with `node scripts/generate-brand-icons.mjs`:

- `app/favicon.ico`: 16, 32, 48, 64, 128 and 256 pixel frames.
- `app/icon.png`: 96 pixels, including a multiple of 48 for search consumers.
- `app/apple-icon.png`: 180 pixels.
- `public/brand/sanbayfusion-icon-{192,512}.png`: web manifest icons.

Next.js file metadata supplies content-versioned ICO, PNG and Apple icon links. The
root layout adds the manifest. Avoid an explicit `metadata.icons` object because
this Next.js version suppresses PNG/Apple file discovery when one is present.
The `/icon` and
`/apple-icon` legacy URLs, `/favicon.png`, common Apple touch URLs, `/manifest.json`
and `/site.webmanifest` resolve to these same assets through rewrites. There is no
second public favicon ICO competing with the app favicon. Open Graph and Twitter
cards retain the current complete Sanbay Fusion logo.

Icon and manifest responses request CDN cache bypass; versioned metadata URLs
refresh clients that saved a previous icon. An existing browser or third-party
branding/search cache cannot be erased by a website deployment. Check the actual
unversioned URL as well as metadata links after deployment to detect stale CDN
responses rather than relying only on a cache-busting query.

Run `node scripts/verify-brand-icons.mjs` against the production build locally.
Set `VERIFY_ORIGIN=https://sanbayfusion.com` to check the public deployment. The
script checks exact asset hashes, all aliases, manifest dimensions, rendered icon
metadata, share image responses and robots rules. It saves a response audit at
`.next/branding-audit/verification.json`. Run from a network permitted by the
domain's Cloudflare rules; an HTML challenge response must not pass verification.

## Production verification, 2 October 2026

Railway deployment `29e505dc-68e3-4dbf-a98d-6e16ec90ec9e` completed successfully.
The production build, TypeScript checks and focused lint checks passed (the share
card retains its existing ImageResponse-specific img lint warning). All 23 HTTP
checks passed locally and against `https://sanbayfusion.com` from the production
server's network. This includes the exact previous deployment's icon query URLs,
not only newly versioned URLs. The public unversioned ICO and previous ICO URL
both returned SHA-256
`973fa83c2cf85a0565de2d7b9f362e00fd13d930e66f3ca590e4002191e3841d`, matching
the replacement file, with `public, max-age=0, must-revalidate` cache control.
The local saved production audit is `.next/branding-audit/production-verification.json`.
Search engines and other third parties may retain their own previous icon copies
until their next refresh; their internal cache state was not changed by deployment.
