# SEO configuration

`NEXT_PUBLIC_SITE_URL` is the active application origin used for absolute email and application links. It must not automatically become Sanbay Fusion's permanent SEO identity.

While production is hosted temporarily on a Railway URL, leave `NEXT_PUBLIC_CANONICAL_URL` empty. The application then omits canonical URLs and business JSON-LD, returns an empty sitemap, and marks pages `noindex`; `robots.txt` disallows indexing. Do not submit the temporary Railway URL to Search Console as the permanent site.

When the future `.co.th` domain is configured:

1. Set both `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_CANONICAL_URL` to the verified public HTTPS origin.
2. Verify redirects, metadata, structured data, `robots.txt`, and sitemap on the new domain.
3. Submit the new domain and sitemap to the corresponding Search Console property.
4. Remove `noindex` only after the canonical domain is ready to be public.

Older domain-specific SEO checks in previous deployment records describe the former custom-domain configuration; they do not represent the current temporary production setup.
