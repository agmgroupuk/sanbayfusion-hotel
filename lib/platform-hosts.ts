export const sharedSessionCookie = "__Secure-sbf_platform_session";

export function publicSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  const url = new URL(configuredUrl);
  const isLocalHttp = url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.protocol !== "https:" && !isLocalHttp) throw new Error("NEXT_PUBLIC_SITE_URL must use HTTPS outside local development.");
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) throw new Error("NEXT_PUBLIC_SITE_URL must be an origin without credentials, path, query, or fragment.");
  return url.origin;
}

export function isConfiguredPublicHost(host: string) {
  const normalizedHost = host.toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
  return normalizedHost === new URL(publicSiteUrl()).hostname.toLowerCase();
}

export function paymentUrl(path: string) {
  if (!path.startsWith("/") || path.startsWith("//")) return "/dashboard";
  try {
    const destination = new URL(path, publicSiteUrl());
    if (destination.origin !== publicSiteUrl() || destination.username || destination.password) return "/dashboard";
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return "/dashboard";
  }
}
