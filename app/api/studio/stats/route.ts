import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { toInputJsonObject } from "@/lib/json";

export const runtime = "nodejs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!isRecord(body) || typeof body.sessionId !== "string" || body.sessionId.length > 128) {
    return NextResponse.json({ error: "Invalid session statistics." }, { status: 400 });
  }

  const numericFields = [
    "totalMessages",
    "totalRequests",
    "totalErrors",
    "totalTokensUsed",
    "sessionStartTime",
  ] as const;
  for (const field of numericFields) {
    if (
      typeof body[field] !== "number" ||
      !Number.isFinite(body[field]) ||
      body[field] < 0
    ) {
      return NextResponse.json({ error: "Invalid session statistics." }, { status: 400 });
    }
  }
  if (!Array.isArray(body.requestLog) || body.requestLog.length > 500) {
    return NextResponse.json({ error: "Invalid request log." }, { status: 400 });
  }

  try {
    const session = await prisma.agentChatSession.findFirst({
      where: { id: body.sessionId, ownerId: user.id },
      select: { id: true },
    });
    if (!session) return NextResponse.json({ error: "Session not found." }, { status: 404 });

    const stats = toInputJsonObject({
      totalMessages: body.totalMessages,
      totalRequests: body.totalRequests,
      totalErrors: body.totalErrors,
      totalTokensUsed: body.totalTokensUsed,
      sessionStartTime: body.sessionStartTime,
      requestLog: body.requestLog,
    });
    await prisma.agentChatStats.upsert({
      where: { sessionId: session.id },
      create: { sessionId: session.id, stats },
      update: { stats },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Session statistics update failed:", error);
    return NextResponse.json({ error: "Session statistics could not be saved." }, { status: 503 });
  }
}
