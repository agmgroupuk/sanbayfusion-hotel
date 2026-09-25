import "server-only";

import { cookies } from "next/headers";
import { z } from "zod";

export const membershipCheckoutCookie = "sbf_membership_checkout";

export const membershipCheckoutSelectionSchema = z.object({
  planSlug: z.string().min(1),
  configuration: z.any(),
});

export async function saveMembershipCheckoutSelection(planSlug: string, configuration: unknown) {
  const cookieStore = await cookies();
  const value = JSON.stringify({ planSlug, configuration });
  cookieStore.set(membershipCheckoutCookie, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 30,
  });
}

export async function readMembershipCheckoutSelection() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(membershipCheckoutCookie)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return membershipCheckoutSelectionSchema.parse(parsed);
  } catch {
    return null;
  }
}

export async function clearMembershipCheckoutSelection() {
  const cookieStore = await cookies();
  cookieStore.delete(membershipCheckoutCookie);
}
