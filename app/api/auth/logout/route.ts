import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true });
    await clearSessionCookie(request, response);
    return response;
  } catch (error) {
    console.error("Sign-out failed:", error);
    return NextResponse.json({ error: "Sign-out failed." }, { status: 503 });
  }
}
