import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { errorResponse, LabApiError, votesForLab } from "@/app/api/lab/_lib";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Sign in to use Labs." }, { status: 401 });
    }
    return NextResponse.json({
      success: true,
      votes: await votesForLab("debate-arena"),
    });
  } catch (error) {
    if (error instanceof LabApiError) return errorResponse(error);
    return NextResponse.json(
      { error: "Debate vote totals are unavailable." },
      { status: 503 },
    );
  }
}
