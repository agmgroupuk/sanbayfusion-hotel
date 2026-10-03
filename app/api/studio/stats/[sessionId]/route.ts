import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { sessionId } = await params;

  try {
    const session = await prisma.agentChatSession.findFirst({
      where: { id: sessionId, ownerId: user.id },
      select: { id: true },
    });
    if (!session) return NextResponse.json({ error: "Session not found." }, { status: 404 });

    const entry = await prisma.agentChatStats.findUnique({
      where: { sessionId: session.id },
      select: { stats: true },
    });
    return NextResponse.json({ success: true, stats: entry?.stats });
  } catch (error) {
    console.error("Session statistics lookup failed:", error);
    return NextResponse.json({ error: "Session statistics are unavailable." }, { status: 503 });
  }
}
