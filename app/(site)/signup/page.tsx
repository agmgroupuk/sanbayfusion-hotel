import type { Metadata } from "next";
import { PageHeader } from "@/components/site/page-header";
import { SignUpForm } from "@/components/auth/auth-forms";
import { getCurrentAccount } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Create Your Account", description: "Create your Sanbay Fusion customer account.", robots: { index: false, follow: false } };

export default async function SignUpPage() {
  if (await getCurrentAccount()) redirect("/dashboard");
  return <><PageHeader eyebrow="Customer account" title="Create Your Account" lead="Create your Sanbay Fusion account to manage your membership, invoices, delivery benefits and account information." /><SignUpForm /></>;
}