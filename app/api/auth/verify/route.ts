import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

async function verify(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    return NextResponse.json({ success: true, valid: Boolean(user), user });
  } catch (error) {
    console.error("Session verification failed:", error);
    return NextResponse.json(
      { success: false, valid: false, error: "Session verification is unavailable." },
      { status: 503 },
    );
  }
}

export const GET = verify;
export const POST = verify;
