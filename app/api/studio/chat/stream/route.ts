import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  AiProviderError,
  requestChatCompletion,
  streamingText,
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
      data: {
        title: session.title.startsWith("PROTOCOL_LOG_")
          ? userText.slice(0, 120)
          : session.title,
      },
    }),
  ]);
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

  try {
    const input = validateChatInput(body);
    const upstream = await requestChatCompletion(input, true, request.signal);
    if (!upstream.body) {
      return NextResponse.json({ error: "The AI provider returned no stream." }, { status: 502 });
    }

    const values = isRecord(body) ? body : {};
    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let buffer = "";
    let fullText = "";
    let saved = false;

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const persist = async () => {
          if (saved) return;
          saved = true;
          await persistConversation(user.id, values.sessionId, input.message, fullText);
        };

        try {
          while (true) {
            const { done, value } = await reader.read();
            buffer += decoder.decode(value, { stream: !done });
            const lines = buffer.split(/\r?\n/);
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.startsWith("data:")) continue;
              const data = line.slice(5).trim();
              if (!data) continue;
              if (data === "[DONE]") {
                await persist();
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                controller.close();
                return;
              }

              try {
                const token = streamingText(input.provider, JSON.parse(data));
                if (token) {
                  fullText += token;
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ content: token })}\n\n`),
                  );
                }
              } catch {
                continue;
              }
            }

            if (done) break;
          }

          await persist();
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Agent chat stream failed:", error);
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      },
      cancel() {
        void reader.cancel();
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
        "X-Provider": input.provider,
      },
    });
  } catch (error) {
    if (error instanceof AiProviderError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Agent chat stream could not start:", error);
    return NextResponse.json({ error: "The AI service is temporarily unavailable." }, { status: 503 });
  }
}
