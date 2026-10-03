import { NextResponse } from "next/server";
import { errorResponse, LabApiError, votesForLab } from "@/app/api/lab/_lib";

export async function GET() {
  try {
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
