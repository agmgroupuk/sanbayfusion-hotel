import { NextResponse, type NextRequest } from "next/server";
import { isPaymentHostEnabled, isPaymentPagePath, mainHost, platformHosts, platformTrustedHosts, sharedSessionCookie } from "./lib/platform-hosts";
export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").toLowerCase().replace(/:\d+$/, "");
  const pathname = request.nextUrl.pathname;
  if (host === platformHosts.pay && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard/payment-methods", `https://${platformHosts.pay}`));
  }
  if (host === platformHosts.pay && (pathname.startsWith("/dashboard") || pathname.startsWith("/membership")) && !isPaymentPagePath(pathname)) {
    return NextResponse.redirect(new URL(`${pathname}${request.nextUrl.search}`, `https://${mainHost}`));
  }
  if (isPaymentHostEnabled() && host === mainHost && isPaymentPagePath(pathname) && ["GET", "HEAD"].includes(request.method)) {
    return NextResponse.redirect(new URL(`${pathname}${request.nextUrl.search}`, `https://${platformHosts.pay}`), 307);
  }
  const headers = new Headers(request.headers);
  headers.set("x-account-destination", request.nextUrl.pathname + request.nextUrl.search);
  const response = NextResponse.next({ request: { headers } });
  // Promote an existing host-only session without creating a new account/session.
  // The database still enforces the token's original expiry and revocation.
  const legacy = request.cookies.get("sbf_customer_session")?.value;
  if (process.env.NODE_ENV === "production" && platformTrustedHosts.includes(host) && legacy && !request.cookies.has(sharedSessionCookie)) {
    response.cookies.set(sharedSessionCookie, legacy, { domain: "sanbayfusion.com", httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 30 * 86400 });
  }
  return response;
}
export const config = { matcher: ["/", "/dashboard/:path*", "/membership/:path*"] };
