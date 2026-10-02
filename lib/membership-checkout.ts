import "server-only";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import { cookies, headers } from "next/headers";
import { platformTrustedHosts } from "./platform-hosts";
import { z } from "zod";
import { membershipConfigurationSchema } from "@/lib/membership-request";
export const membershipCheckoutCookie = "sbf_membership_checkout";
export const sharedCheckoutCookie = "sbf_platform_membership_checkout";
export const membershipCheckoutSelectionSchema = z.object({ planSlug: z.string().min(1), configuration: membershipConfigurationSchema });
export async function saveMembershipCheckoutSelection(planSlug: string, configuration: unknown) {
  const store = await cookies();
  const value = deflateRawSync(Buffer.from(JSON.stringify(membershipCheckoutSelectionSchema.parse({ planSlug, configuration })))).toString("base64url");
  const chunks = value.match(/.{1,2800}/g) ?? [];
  if (!chunks.length || chunks.length > 4) throw new Error("Membership selection is too large");
  const shared = process.env.NODE_ENV === "production" && platformTrustedHosts.includes((await headers()).get("host") ?? "");
  const prefix = shared ? sharedCheckoutCookie : membershipCheckoutCookie;
  const options = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24, ...(shared ? {domain:"sanbayfusion.com"} : {}) };
  store.set(prefix, `v2:${chunks.length}`, options);
  for (let index = 0; index < 4; index++) {
    const name = `${prefix}_${index}`;
    store.set(name,chunks[index] ?? "",{...options,...(!chunks[index] ? {maxAge:0} : {})});
  }
  if (shared) {
    // Do not duplicate a large cart in host-only and domain cookies.
    store.delete(membershipCheckoutCookie);
    for (let index=0;index<4;index++) store.delete(`${membershipCheckoutCookie}_${index}`);
  }
}
export async function readMembershipCheckoutSelection() {
  const store = await cookies();
  const prefix = store.get(sharedCheckoutCookie)?.value ? sharedCheckoutCookie : membershipCheckoutCookie;
  const raw = store.get(prefix)?.value;
  if (!raw) return null;
  try {
    let json = raw;
    if (/^v2:[1-4]$/.test(raw)) {
      const encoded = Array.from({ length: Number(raw.slice(3)) }, (_, i) => store.get(`${prefix}_${i}`)?.value ?? "").join("");
      if (encoded.length > 11200) return null;
      json = inflateRawSync(Buffer.from(encoded, "base64url"), { maxOutputLength: 65536 }).toString("utf8");
    }
    return membershipCheckoutSelectionSchema.parse(JSON.parse(json));
  } catch { return null; }
}
export async function clearMembershipCheckoutSelection() {
  const store = await cookies(); store.delete(membershipCheckoutCookie);
  for (let i = 0; i < 4; i++) store.delete(`${membershipCheckoutCookie}_${i}`);
  for (const name of [sharedCheckoutCookie,...Array.from({length:4},(_,i)=>`${sharedCheckoutCookie}_${i}`)]) store.set(name,"",{domain:"sanbayfusion.com",path:"/",httpOnly:true,secure:true,sameSite:"lax",maxAge:0});
}
