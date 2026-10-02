import { platformUrl } from "./platform-hosts";
/** Accept only internal account and membership destinations, never a caller's host. */
export function getSafeRedirectPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || /[\\\s\u0000-\u001f\u007f]/.test(value)) return "/dashboard";
  try {
    const url = new URL(value, "https://sanbayfusion.com");
    if (url.origin !== "https://sanbayfusion.com") return "/dashboard";
    // Path encoding is unnecessary for these routes and can conceal separators or traversal.
    if (!/^\/(dashboard|membership|admin)(\/[-a-z0-9]+)*\/?$/.test(url.pathname)) return "/dashboard";
    return url.pathname + url.search + url.hash;
  } catch { return "/dashboard"; }
}

export const membershipApplicationPath = platformUrl("pay", "/membership/checkout");
export const membershipSignInPath = platformUrl("pay", `/signin?next=${encodeURIComponent("/membership/checkout")}`);
