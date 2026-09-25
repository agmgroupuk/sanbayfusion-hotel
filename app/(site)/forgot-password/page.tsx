import type { Metadata } from "next";
import { PageHeader } from "@/components/site/page-header";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Forgot Your Password?", description: "Reset your Sanbay Fusion account password.", robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  return <><PageHeader eyebrow="Customer account" title="Forgot Your Password?" lead="Enter your email address and we'll send you instructions to reset your password." /><ForgotPasswordForm /></>;
}