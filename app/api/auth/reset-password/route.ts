import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashToken } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: { token?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!token || password.length < 8 || password.length > 128) {
    return NextResponse.json(
      { error: "A valid reset token and an 8–128 character password are required." },
      { status: 400 },
    );
  }

  try {
    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(token) },
    });
    if (!record || record.expiresAt <= new Date()) {
      return NextResponse.json({ error: "This reset link is invalid or expired." }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.platformUser.update({
        where: { id: record.userId },
        data: { passwordHash: await hashPassword(password) },
      }),
      prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
      prisma.platformSession.deleteMany({ where: { userId: record.userId } }),
    ]);

    return NextResponse.json({ success: true, message: "Password updated. Sign in to continue." });
  } catch (error) {
    console.error("Password reset failed:", error);
    return NextResponse.json({ error: "Password reset could not be completed." }, { status: 503 });
  }
}
