import { platformHosts } from "./platform-hosts";
/** Only deployment configuration can add public origins; request host headers cannot. */
export function trustedPublicOrigins() {
  const values = [process.env.NEXT_PUBLIC_SITE_URL || "https://sanbayfusion.com", ...Object.values(platformHosts).map(host => `https://${host}`)];
  const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN;
  if (railwayDomain && /^[a-z0-9.-]+(?::\d+)?$/i.test(railwayDomain)) values.push(`https://${railwayDomain}`);
  return values.flatMap(value => {
    try {
      const url = new URL(value);
      return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? [url.origin] : [];
    } catch { return []; }
  });
}

export function hasValidRequestOrigin(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  // Preserve support for non-browser callers; browser cross-site requests are rejected above.
  if (origin === null) return true;
  const allowed = trustedPublicOrigins();
  if (process.env.NODE_ENV !== "production") {
    const local = new URL(request.url);
    if (["localhost", "127.0.0.1", "[::1]"].includes(local.hostname)) allowed.push(local.origin);
  }
  // Exact comparison rejects null, paths, credentials, suffix domains and multiple origins.
  return allowed.includes(origin);
}

export const originRejection = {
  code: "UNTRUSTED_ORIGIN",
  error: "We couldn't verify this request. Please reload the Sanbay Fusion page and try again.",
};
