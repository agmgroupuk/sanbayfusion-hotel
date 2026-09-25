import type { Metadata } from "next";
import { PageHeader } from "@/components/site/page-header";
import { SignInForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Welcome Back", description: "Sign in to manage your Sanbay Fusion membership." };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ created?: string; reset?: string }> }) {
  const params = await searchParams;
  const notice = params.created === "1"
    ? "Your account is ready. Sign in to continue."
    : params.reset === "requested"
      ? "If an account exists for that email, reset instructions have been sent."
      : params.reset === "complete"
        ? "Your password has been updated. Sign in with your new password."
        : undefined;
  return <><PageHeader eyebrow="Customer account" title="Welcome Back" lead="Sign in to manage your Sanbay Fusion membership." /><SignInForm notice={notice} /></>;
}