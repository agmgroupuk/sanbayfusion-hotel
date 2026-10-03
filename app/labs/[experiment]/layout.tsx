import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUserFromToken, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

export default async function LabExperimentLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ experiment: string }>;
}) {
  const { experiment } = await params;
  const cookieStore = await cookies();
  const user = await getCurrentUserFromToken(
    cookieStore.get(SESSION_COOKIE)?.value,
  );
  if (!user) {
    redirect(
      `/auth/signin?redirect=${encodeURIComponent(`/labs/${experiment}`)}`,
    );
  }

  return children;
}
