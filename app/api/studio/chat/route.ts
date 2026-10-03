import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  AiProviderError,
  completionText,
  requestChatCompletion,
  validateChatInput,
} from "@/lib/ai-provider";

export const runtime = "nodejs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function persistConversation(
  ownerId: string,
  sessionId: unknown,
  userText: string,
  assistantText: string,
) {
  if (
    typeof sessionId !== "string" ||
    !sessionId ||
    sessionId.length > 128 ||
    /[\/\\]/.test(sessionId)
  ) {
    return;
  }

  try {
    const session = await prisma.agentChatSession.findFirst({
      where: { id: sessionId, ownerId },
    });
    if (!session) return;

    await prisma.$transaction([
      prisma.agentChatMessage.create({
        data: { sessionId: session.id, sender: "YOU", text: userText },
      }),
      prisma.agentChatMessage.create({
        data: { sessionId: session.id, sender: "AGENT", text: assistantText },
      }),
      prisma.agentChatSession.update({
        where: { id: session.id },
        data: { title: session.title.startsWith("PROTOCOL_LOG_") ? userText.slice(0, 120) : session.title },
      }),
    ]);
  } catch (error) {
    console.error(
      "Agent conversation could not be saved:",
      error instanceof Error ? error.name : "Unknown error",
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request).catch((error: unknown) => {
    console.error(
      "Optional agent session lookup failed:",
      error instanceof Error ? error.name : "Unknown error",
    );
    return null;
  });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const input = validateChatInput(body);
    const response = await requestChatCompletion(input, false, request.signal);
    const text = await completionText(response, input.provider);
    if (!text) {
      return NextResponse.json({ error: "The AI provider returned an empty response." }, { status: 502 });
    }

    const values = isRecord(body) ? body : {};
    if (user) {
      await persistConversation(user.id, values.sessionId, input.message, text);
    }

    return NextResponse.json({
      response: text,
      provider: input.provider,
      durationMs: 0,
    });
  } catch (error) {
    if (error instanceof AiProviderError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Agent chat request failed:", error);
    return NextResponse.json({ error: "The AI service is temporarily unavailable." }, { status: 503 });
  }
}
