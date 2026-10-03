import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: { email?: unknown; name?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (password.length < 8 || password.length > 128) {
    return NextResponse.json(
      { error: "Password must be between 8 and 128 characters." },
      { status: 400 },
    );
  }
  if (name.length > 100) {
    return NextResponse.json({ error: "Name must be 100 characters or fewer." }, { status: 400 });
  }

  try {
    const user = await prisma.platformUser.create({
      data: {
        email,
        name: name || email.slice(0, email.indexOf("@")),
        passwordHash: await hashPassword(password),
      },
      select: { id: true, email: true, name: true, role: true },
    });

    const response = NextResponse.json({ success: true, user }, { status: 201 });
    await setSessionCookie(response, user.id);
    return response;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ error: "An account already exists for this email." }, { status: 409 });
    }
    console.error("Signup failed:", error);
    return NextResponse.json({ error: "Account creation failed." }, { status: 500 });
  }
}
