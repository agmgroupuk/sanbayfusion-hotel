import type { Metadata } from "next";
import { PageHeader } from "@/components/site/page-header";
import { ResetPasswordForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Reset Your Password", description: "Choose a new password for your Sanbay Fusion account." };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return <><PageHeader eyebrow="Customer account" title="Reset Your Password" lead="Choose a new password for your Sanbay Fusion account." /><ResetPasswordForm token={token} /></>;
}