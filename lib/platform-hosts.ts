export const mainHost = "sanbayfusion.com";
export const platformHosts = { pay: "pay.sanbayfusion.com" } as const;
export const platformTrustedHosts = [mainHost, platformHosts.pay];
export const sharedSessionCookie = "__Secure-sbf_platform_session";

const paymentPagePaths = [
  "/membership/checkout",
  "/membership/payment",
  "/membership/payment-failed",
  "/membership/success",
  "/membership/thank-you",
  "/dashboard/checkout",
  "/dashboard/payment-methods",
];

export function isPaymentHostEnabled() {
  return process.env.NEXT_PUBLIC_PAYMENT_HOST_ENABLED === "true";
}

export function paymentUrl(path: string) {
  if (!path.startsWith("/")) return "/dashboard";
  try {
    const destination = new URL(path, `https://${mainHost}`);
    if (destination.origin !== `https://${mainHost}` || destination.username || destination.password) return "/dashboard";
    const safePath = `${destination.pathname}${destination.search}${destination.hash}`;
    return isPaymentHostEnabled() ? `https://${platformHosts.pay}${safePath}` : safePath;
  } catch {
    return "/dashboard";
  }
}

export function isPaymentPagePath(pathname: string) {
  return paymentPagePaths.some(path => pathname === path || pathname.startsWith(`${path}/`));
}
