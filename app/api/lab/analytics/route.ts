import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Sign in to view Lab activity." }, { status: 401 });
    }

    const [totalRuns, recentRuns, groupedRuns] = await Promise.all([
      prisma.labRun.count({ where: { userId: user.id } }),
      prisma.labRun.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, labId: true, provider: true, createdAt: true },
      }),
      prisma.labRun.groupBy({
        by: ["labId"],
        where: { userId: user.id },
        _count: { _all: true },
      }),
    ]);

    return NextResponse.json({
      totalRuns,
      byExperiment: Object.fromEntries(
        groupedRuns.map((row) => [row.labId, row._count._all]),
      ),
      recentRuns,
    });
  } catch (error) {
    console.error("[lab/analytics] Failed to load account activity.", error);
    return NextResponse.json(
      { error: "Lab activity is temporarily unavailable." },
      { status: 503 },
    );
  }
}
