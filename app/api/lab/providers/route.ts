import { NextResponse } from "next/server";
import { configuredLabProviders, errorResponse, LabApiError } from "@/app/api/lab/_lib";

export async function GET() {
  try {
    return NextResponse.json({
      providers: configuredLabProviders().map(({ id, label }) => ({ id, label })),
    });
  } catch (error) {
    if (error instanceof LabApiError) return errorResponse(error);
    return NextResponse.json(
      { error: "Unable to load configured AI providers." },
      { status: 503 },
    );
  }
}
