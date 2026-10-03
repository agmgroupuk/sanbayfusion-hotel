import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  errorResponse,
  LabApiError,
  readJsonBody,
  updateVote,
} from "@/app/api/lab/_lib";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Sign in to vote." }, { status: 401 });
    }
    const body = await readJsonBody(request, 2_000);
    const topicId =
      typeof body.topicId === "string" ? body.topicId.trim() : "";
    if (!topicId || topicId.length > 80) {
      throw new LabApiError("topicId is required.", 400);
    }
    if (body.position !== "for" && body.position !== "against") {
      throw new LabApiError("position must be for or against.", 400);
    }

    const result = await updateVote(
      user.id,
      topicId,
      body.position,
      "debate-arena",
    );
    return NextResponse.json({ success: true, votes: result.votes });
  } catch (error) {
    if (error instanceof LabApiError) return errorResponse(error);
    return NextResponse.json(
      { error: "Your vote could not be saved. Please try again." },
      { status: 503 },
    );
  }
}
