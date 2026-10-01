"use server";
export type MembershipApplicationResult = { ok: true; requestNumber: string; demo?: boolean } | { ok: false; error: string };
export async function submitMembershipApplication(_raw: unknown): Promise<MembershipApplicationResult> {
  void _raw;
  return { ok: false, error: "Continue at /membership/checkout to sign in, save your payment method, and authorize your application." };
}
