import type { Metadata } from "next";
import { PageHeader } from "@/components/site/page-header";
import { SignUpForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Create Your Account", description: "Create your Sanbay Fusion customer account." };

export default function SignUpPage() {
  return <><PageHeader eyebrow="Customer account" title="Create Your Account" lead="Create your Sanbay Fusion account to manage your membership, invoices, delivery benefits and account information." /><SignUpForm /></>;
}