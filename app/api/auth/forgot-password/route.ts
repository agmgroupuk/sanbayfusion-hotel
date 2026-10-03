import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashToken } from "@/lib/auth";
import { isEmailConfigured, sendPasswordResetEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: "Password recovery email is not configured on this deployment." },
      { status: 503 },
    );
  }

  try {
    const user = await prisma.platformUser.findUnique({ where: { email } });
    if (user) {
      const token = randomBytes(32).toString("base64url");
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      await prisma.$transaction([
        prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
        prisma.passwordResetToken.create({
          data: { tokenHash: hashToken(token), userId: user.id, expiresAt },
        }),
      ]);

      const baseUrl = process.env.APP_BASE_URL;
      if (!baseUrl) throw new Error("APP_BASE_URL is not configured.");
      const resetUrl = new URL("/auth/reset-password", baseUrl);
      resetUrl.searchParams.set("token", token);
      await sendPasswordResetEmail(user.email, resetUrl.toString());
    }

    return NextResponse.json({
      success: true,
      message: "If an account matches that email, reset instructions have been sent.",
    });
  } catch (error) {
    console.error("Password recovery failed:", error);
    return NextResponse.json(
      { error: "Password recovery could not be completed. Please try again later." },
      { status: 503 },
    );
  }
}
