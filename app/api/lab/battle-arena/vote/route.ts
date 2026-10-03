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
    const battleKey =
      typeof body.battleKey === "string" ? body.battleKey.trim() : "";
    if (!battleKey || battleKey.length > 80) {
      throw new LabApiError("battleKey is required.", 400);
    }
    if (body.winner !== "model1" && body.winner !== "model2") {
      throw new LabApiError("winner must be model1 or model2.", 400);
    }

    const result = await updateVote(
      user.id,
      battleKey,
      body.winner,
      "battle-arena",
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
