import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  try {
    const feedback = await prisma.agentChatFeedback.findMany({
      where: { userId: user.id },
      select: { messageId: true, value: true },
    });
    return NextResponse.json({
      success: true,
      liked: feedback.filter((item) => item.value === "like").map((item) => item.messageId),
      disliked: feedback.filter((item) => item.value === "dislike").map((item) => item.messageId),
    });
  } catch (error) {
    console.error("Feedback lookup failed:", error);
    return NextResponse.json({ error: "Feedback is temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  let body: { messageId?: unknown; type?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const messageId = typeof body.messageId === "string" ? body.messageId : "";
  const type = body.type;
  if (
    !messageId ||
    messageId.length > 128 ||
    (type !== "like" && type !== "dislike" && type !== "remove")
  ) {
    return NextResponse.json({ error: "Invalid feedback details." }, { status: 400 });
  }

  try {
    const message = await prisma.agentChatMessage.findUnique({
      where: { id: messageId },
      select: { session: { select: { ownerId: true } } },
    });
    if (!message || message.session.ownerId !== user.id) {
      return NextResponse.json({ error: "Message not found." }, { status: 404 });
    }

    if (type === "remove") {
      await prisma.agentChatFeedback.deleteMany({
        where: { userId: user.id, messageId },
      });
    } else {
      await prisma.agentChatFeedback.upsert({
        where: { userId_messageId: { userId: user.id, messageId } },
        create: { userId: user.id, messageId, value: type },
        update: { value: type },
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Feedback update failed:", error);
    return NextResponse.json({ error: "Feedback could not be saved." }, { status: 503 });
  }
}
