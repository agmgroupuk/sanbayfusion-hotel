import type { Metadata } from "next";
import { PageHeader } from "@/components/site/page-header";
import { SignUpForm } from "@/components/auth/auth-forms";
import { getCurrentAccount } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSafeRedirectPath } from "@/lib/auth-redirect";

export const metadata: Metadata = { title: "Create Your Account", description: "Create your Sanbay Fusion customer account.", robots: { index: false, follow: false } };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  const next = getSafeRedirectPath(params.next);
  if (await getCurrentAccount()) redirect(next);
  return <><PageHeader eyebrow="Customer account" title="Create Your Account" lead="Create your Sanbay Fusion account to manage your membership, invoices, delivery benefits and account information." /><SignUpForm next={next} /></>;
}
