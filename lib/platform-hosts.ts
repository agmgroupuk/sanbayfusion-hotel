export const platformHosts = { account: "account.sanbayfusion.com", pay: "pay.sanbayfusion.com", checkout: "checkout.sanbayfusion.com" } as const;
export const platformTrustedHosts = ["sanbayfusion.com", ...Object.values(platformHosts)];
export function platformUrl(flow: keyof typeof platformHosts, path: string) {
  return process.env.NEXT_PUBLIC_CONNECTED_SUBDOMAINS === "true" ? `https://${platformHosts[flow]}${path}` : path;
}
export const sharedSessionCookie = "__Secure-sbf_platform_session";
