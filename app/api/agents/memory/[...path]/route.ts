import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { toInputJsonArray, toInputJsonObject } from "@/lib/json";
import {
  completionText,
  firstConfiguredProvider,
  requestChatCompletion,
  validateChatInput,
} from "@/lib/ai-provider";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ path: string[] }> };

const profileFields = [
  "name",
  "dateOfBirth",
  "gender",
  "nationality",
  "language",
  "profession",
  "workplace",
  "interests",
  "hobbies",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emptyProfile() {
  return Object.fromEntries(profileFields.map((field) => [field, ""]));
}

async function handle(request: NextRequest, { params }: RouteContext) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { path } = await params;
  const [requestedUserId, agentId, action] = path;
  if (
    path.length < 2 ||
    path.length > 3 ||
    requestedUserId !== user.id ||
    !agentId ||
    !/^[a-zA-Z0-9_-]{1,100}$/.test(agentId)
  ) {
    return NextResponse.json({ error: "Invalid memory path." }, { status: 400 });
  }

  try {
    const where = { userId_agentId: { userId: user.id, agentId } };
    const existing = await prisma.agentMemory.findUnique({ where });

    if (request.method === "GET" && !action) {
      const profile = isRecord(existing?.profile) ? existing.profile : emptyProfile();
      const memories = Array.isArray(existing?.memories) ? existing.memories : [];
      return NextResponse.json({
        success: true,
        data: {
          userProfile: profile,
          memories,
          memoryEnabled: existing?.enabled ?? true,
        },
      });
    }

    if (request.method === "POST" && action === "profile") {
      const body: unknown = await request.json();
      if (!isRecord(body) || !isRecord(body.updates)) {
        return NextResponse.json({ error: "Profile updates are required." }, { status: 400 });
      }
      const currentProfile = isRecord(existing?.profile) ? existing.profile : emptyProfile();
      const updatedProfile: Record<string, unknown> = { ...currentProfile };
      for (const field of profileFields) {
        const value = body.updates[field];
        if (value !== undefined) {
          if (typeof value !== "string" || value.length > 500) {
            return NextResponse.json({ error: `Invalid profile field: ${field}.` }, { status: 400 });
          }
          updatedProfile[field] = value;
        }
      }
      const memoryEnabled =
        typeof body.updates._memoryEnabled === "boolean"
          ? body.updates._memoryEnabled
          : existing?.enabled ?? true;
      await prisma.agentMemory.upsert({
        where,
        create: {
          userId: user.id,
          agentId,
          profile: toInputJsonObject(updatedProfile),
          enabled: memoryEnabled,
        },
        update: {
          profile: toInputJsonObject(updatedProfile),
          enabled: memoryEnabled,
        },
      });
      return NextResponse.json({ success: true });
    }

    if (request.method === "DELETE" && !action) {
      const body: unknown = await request.json();
      if (!isRecord(body) || body.clearAll !== true) {
        return NextResponse.json({ error: "Invalid memory operation." }, { status: 400 });
      }
      await prisma.agentMemory.upsert({
        where,
        create: { userId: user.id, agentId },
        update: { memories: toInputJsonArray([]) },
      });
      return NextResponse.json({ success: true });
    }

    if (request.method === "POST" && action === "add") {
      const body: unknown = await request.json();
      if (
        !isRecord(body) ||
        typeof body.type !== "string" ||
        body.type.length > 40 ||
        typeof body.content !== "string" ||
        !body.content.trim() ||
        body.content.length > 2000
      ) {
        return NextResponse.json({ error: "Invalid memory entry." }, { status: 400 });
      }
      const memories = Array.isArray(existing?.memories) ? existing.memories : [];
      if (memories.length >= 200) {
        return NextResponse.json({ error: "Memory limit reached." }, { status: 409 });
      }
      const importance =
        typeof body.importance === "number" && Number.isFinite(body.importance)
          ? Math.min(5, Math.max(1, Math.round(body.importance)))
          : 3;
      const updatedMemories = [
        ...memories,
        {
          id: randomUUID(),
          type: body.type.trim(),
          content: body.content.trim(),
          importance,
          createdAt: new Date().toISOString(),
        },
      ];
      await prisma.agentMemory.upsert({
        where,
        create: {
          userId: user.id,
          agentId,
          memories: toInputJsonArray(updatedMemories),
        },
        update: { memories: toInputJsonArray(updatedMemories) },
      });
      return NextResponse.json({ success: true });
    }

    if (request.method === "POST" && action === "learn") {
      const body: unknown = await request.json();
      if (!isRecord(body) || !Array.isArray(body.messages) || body.messages.length > 10) {
        return NextResponse.json({ error: "Invalid conversation data." }, { status: 400 });
      }
      if (!(existing?.enabled ?? true)) return NextResponse.json({ success: true });

      const provider = firstConfiguredProvider();
      if (!provider) {
        return NextResponse.json(
          { error: "Memory extraction requires a configured AI provider." },
          { status: 503 },
        );
      }
      const conversation = body.messages
        .filter(isRecord)
        .filter((item) => typeof item.content === "string")
        .map((item) => ({
          role: item.role === "assistant" ? "assistant" : "user",
          content: (item.content as string).slice(0, 3000),
        }));
      if (!conversation.length) return NextResponse.json({ success: true });

      const input = validateChatInput({
        provider,
        message: `Extract only stable, useful user facts from this conversation as a JSON array of objects with type, content, and importance (1-5). Return [] if there are none. Do not infer sensitive personal data.\n\n${JSON.stringify(conversation)}`,
        systemPrompt: "You extract concise user-approved memory facts. Output only valid JSON.",
        temperature: 0,
        maxTokens: 800,
      });
      const response = await requestChatCompletion(input, false, request.signal);
      const output = await completionText(response, provider);
      const start = output.indexOf("[");
      const end = output.lastIndexOf("]");
      const extracted: unknown = start >= 0 && end > start
        ? JSON.parse(output.slice(start, end + 1))
        : [];
      if (!Array.isArray(extracted)) {
        return NextResponse.json({ error: "The provider returned invalid memory data." }, { status: 502 });
      }
      const currentMemories = Array.isArray(existing?.memories) ? existing.memories : [];
      const additions = extracted
        .filter(isRecord)
        .filter((item) =>
          typeof item.type === "string" &&
          item.type.length <= 40 &&
          typeof item.content === "string" &&
          item.content.trim().length > 0 &&
          item.content.length <= 1000,
        )
        .slice(0, 5)
        .map((item) => ({
          id: randomUUID(),
          type: (item.type as string).trim(),
          content: (item.content as string).trim(),
          importance:
            typeof item.importance === "number" && Number.isFinite(item.importance)
              ? Math.min(5, Math.max(1, Math.round(item.importance)))
              : 3,
          createdAt: new Date().toISOString(),
        }));
      const updatedMemories = [...currentMemories, ...additions].slice(-200);
      await prisma.agentMemory.upsert({
        where,
        create: {
          userId: user.id,
          agentId,
          memories: toInputJsonArray(updatedMemories),
        },
        update: { memories: toInputJsonArray(updatedMemories) },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Memory route not found." }, { status: 404 });
  } catch (error) {
    console.error("Agent memory request failed:", error);
    return NextResponse.json({ error: "Agent memory is temporarily unavailable." }, { status: 503 });
  }
}

export const GET = handle;
export const POST = handle;
export const DELETE = handle;
