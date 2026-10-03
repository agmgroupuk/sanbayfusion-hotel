import { NextResponse, type NextRequest } from "next/server";
import { isConfiguredPublicHost, sharedSessionCookie } from "./lib/platform-hosts";
export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").toLowerCase().replace(/:\d+$/, "");
  const headers = new Headers(request.headers);
  headers.set("x-account-destination", request.nextUrl.pathname + request.nextUrl.search);
  const response = NextResponse.next({ request: { headers } });
  // Promote an existing host-only session without creating a new account/session.
  // The database still enforces the token's original expiry and revocation.
  const legacy = request.cookies.get("sbf_customer_session")?.value;
  if (process.env.NODE_ENV === "production" && isConfiguredPublicHost(host) && legacy && !request.cookies.has(sharedSessionCookie)) {
    response.cookies.set(sharedSessionCookie, legacy, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 30 * 86400 });
  }
  return response;
}
export const config = { matcher: ["/", "/dashboard/:path*", "/membership/:path*"] };
