import type { Metadata } from "next";
import { PageHeader } from "@/components/site/page-header";
import { SignInForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Welcome Back", description: "Sign in to manage your Sanbay Fusion membership." };

export default function SignInPage() {
  return <><PageHeader eyebrow="Customer account" title="Welcome Back" lead="Sign in to manage your Sanbay Fusion membership." /><SignInForm /></>;
}