import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { toInputJsonObject } from "@/lib/json";

export const runtime = "nodejs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  try {
    const rows = await prisma.agentChatSession.findMany({
      where: { ownerId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    return NextResponse.json({
      success: true,
      sessions: rows.map((session) => ({
        id: session.id,
        title: session.title,
        agentId: session.agentId,
        active: session.active,
        settings: session.settings ?? {},
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
        messages: session.messages.map((message) => ({
          id: message.id,
          role: message.sender === "YOU" ? "user" : "assistant",
          content: message.text,
          timestamp: message.createdAt.toISOString(),
        })),
      })),
    });
  } catch (error) {
    console.error("Session list failed:", error);
    return NextResponse.json({ error: "Sessions are temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!isRecord(parsed)) throw new Error("Expected an object.");
    body = parsed;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const id = typeof body.localId === "string" ? body.localId.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const agentId = typeof body.agentId === "string" ? body.agentId.trim() : "";
  let settings;
  try {
    settings = toInputJsonObject(isRecord(body.settings) ? body.settings : {});
  } catch {
    return NextResponse.json({ error: "Invalid session settings." }, { status: 400 });
  }

  if (!id || id.length > 128 || /[\/\\]/.test(id)) {
    return NextResponse.json({ error: "Invalid session id." }, { status: 400 });
  }
  if (!title || title.length > 160 || !/^[a-zA-Z0-9_-]{1,100}$/.test(agentId)) {
    return NextResponse.json({ error: "Invalid session details." }, { status: 400 });
  }

  try {
    const existing = await prisma.agentChatSession.findUnique({ where: { id } });
    if (existing) {
      if (existing.ownerId !== user.id) {
        return NextResponse.json({ error: "Session id is unavailable." }, { status: 409 });
      }
      return NextResponse.json({ success: true, sessionId: existing.id });
    }

    await prisma.$transaction([
      prisma.agentChatSession.updateMany({
        where: { ownerId: user.id, agentId },
        data: { active: false },
      }),
      prisma.agentChatSession.create({
        data: {
          id,
          ownerId: user.id,
          agentId,
          title,
          active: true,
          settings,
        },
      }),
    ]);

    return NextResponse.json({ success: true, sessionId: id }, { status: 201 });
  } catch (error) {
    console.error("Session creation failed:", error);
    return NextResponse.json({ error: "Session could not be created." }, { status: 503 });
  }
}
