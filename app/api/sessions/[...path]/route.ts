import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { toInputJsonObject } from "@/lib/json";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ path: string[] }> };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readBody(request: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return isRecord(body) ? body : null;
  } catch {
    return null;
  }
}

async function findOwnedSession(id: string, ownerId: string) {
  return prisma.agentChatSession.findFirst({ where: { id, ownerId } });
}

async function route(request: NextRequest, { params }: RouteContext) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { path } = await params;
  const [first, second, third] = path;

  try {
    if (request.method === "GET" && first === "load" && path.length === 1) {
      const agentId = request.nextUrl.searchParams.get("agentId") || "";
      const limit = Math.min(
        100,
        Math.max(1, Number.parseInt(request.nextUrl.searchParams.get("limit") || "50", 10) || 50),
      );
      if (!/^[a-zA-Z0-9_-]{1,100}$/.test(agentId)) {
        return NextResponse.json({ error: "Invalid agent id." }, { status: 400 });
      }

      const sessions = await prisma.agentChatSession.findMany({
        where: { ownerId: user.id, agentId },
        orderBy: { updatedAt: "desc" },
        take: limit,
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
      const activeSessionId = sessions.find((session) => session.active)?.id;
      return NextResponse.json({
        success: true,
        activeSessionId,
        sessions: sessions.map((session) => ({
          id: session.id,
          name: session.title,
          active: session.active,
          settings: session.settings ?? {},
          messages: session.messages.map((message) => ({
            id: message.id,
            sender: message.sender,
            text: message.text,
            timestamp: message.createdAt.toISOString(),
          })),
        })),
      });
    }

    if (request.method === "PUT" && first === "active" && path.length === 1) {
      const body = await readBody(request);
      const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
      const target = await findOwnedSession(sessionId, user.id);
      if (!target) return NextResponse.json({ error: "Session not found." }, { status: 404 });
      await prisma.$transaction([
        prisma.agentChatSession.updateMany({
          where: { ownerId: user.id, agentId: target.agentId },
          data: { active: false },
        }),
        prisma.agentChatSession.update({
          where: { id: sessionId },
          data: { active: true },
        }),
      ]);
      return NextResponse.json({ success: true });
    }

    if (!first || first.length > 128 || /[\/\\]/.test(first)) {
      return NextResponse.json({ error: "Invalid session path." }, { status: 400 });
    }

    const session = await findOwnedSession(first, user.id);
    if (!session) return NextResponse.json({ error: "Session not found." }, { status: 404 });

    if (request.method === "GET" && second === "files" && path.length === 2) {
      const files = await prisma.agentChatFile.findMany({
        where: { sessionId: session.id },
        orderBy: { filePath: "asc" },
      });
      return NextResponse.json({
        success: true,
        files: Object.fromEntries(files.map((file) => [file.filePath, file.content])),
      });
    }

    if (request.method === "POST" && second === "files" && path.length === 2) {
      const body = await readBody(request);
      if (!body || !isRecord(body.files)) {
        return NextResponse.json({ error: "A files object is required." }, { status: 400 });
      }
      const entries = Object.entries(body.files);
      if (entries.length > 500 || entries.some(([filePath, content]) =>
        !filePath || filePath.length > 500 || filePath.includes("..") ||
        typeof content !== "string" || content.length > 250_000
      )) {
        return NextResponse.json({ error: "Files exceed the allowed limits." }, { status: 413 });
      }
      await prisma.$transaction([
        prisma.agentChatFile.deleteMany({ where: { sessionId: session.id } }),
        ...entries.map(([filePath, content]) =>
          prisma.agentChatFile.create({
            data: { sessionId: session.id, filePath, content: content as string },
          }),
        ),
      ]);
      return NextResponse.json({ success: true });
    }

    if (request.method === "PUT" && second === "settings" && path.length === 2) {
      const body = await readBody(request);
      if (!body || !isRecord(body.settings)) {
        return NextResponse.json({ error: "A settings object is required." }, { status: 400 });
      }
      let settings;
      try {
        settings = toInputJsonObject(body.settings);
      } catch {
        return NextResponse.json({ error: "Invalid settings object." }, { status: 400 });
      }
      await prisma.agentChatSession.update({
        where: { id: session.id },
        data: { settings },
      });
      return NextResponse.json({ success: true });
    }

    if (request.method === "PUT" && path.length === 1) {
      const body = await readBody(request);
      const title = typeof body?.title === "string" ? body.title.trim() : "";
      if (!title || title.length > 160) {
        return NextResponse.json({ error: "Title must be 1–160 characters." }, { status: 400 });
      }
      await prisma.agentChatSession.update({
        where: { id: session.id },
        data: { title },
      });
      return NextResponse.json({ success: true });
    }

    if (request.method === "DELETE" && second === "messages" && path.length === 2) {
      await prisma.agentChatMessage.deleteMany({ where: { sessionId: session.id } });
      return NextResponse.json({ success: true });
    }

    if (request.method === "DELETE" && second === "files" && third && path.length === 3) {
      const filePath = decodeURIComponent(third);
      await prisma.agentChatFile.deleteMany({
        where: { sessionId: session.id, filePath },
      });
      return NextResponse.json({ success: true });
    }

    if (
      (request.method === "PUT" || request.method === "DELETE") &&
      second === "messages" && third && path.length === 3
    ) {
      const message = await prisma.agentChatMessage.findFirst({
        where: { id: third, sessionId: session.id },
      });
      if (!message) return NextResponse.json({ error: "Message not found." }, { status: 404 });

      if (request.method === "DELETE") {
        await prisma.agentChatMessage.delete({ where: { id: message.id } });
        return NextResponse.json({ success: true });
      }
      const body = await readBody(request);
      const content = typeof body?.content === "string" ? body.content : "";
      if (content.length > 100_000) {
        return NextResponse.json({ error: "Message is too large." }, { status: 413 });
      }
      await prisma.agentChatMessage.update({
        where: { id: message.id },
        data: { text: content },
      });
      return NextResponse.json({ success: true });
    }

    if (request.method === "DELETE" && path.length === 1) {
      await prisma.agentChatSession.delete({ where: { id: session.id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Route not found." }, { status: 404 });
  } catch (error) {
    console.error("Session API failed:", error);
    return NextResponse.json({ error: "Session request could not be completed." }, { status: 503 });
  }
}

export const GET = route;
export const POST = route;
export const PUT = route;
export const DELETE = route;
