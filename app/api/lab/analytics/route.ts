import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const [totalRuns, recentRuns, groupedRuns] = await Promise.all([
      prisma.labRun.count({ where: { userId: null } }),
      prisma.labRun.findMany({
        where: { userId: null },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, labId: true, provider: true, createdAt: true },
      }),
      prisma.labRun.groupBy({
        by: ["labId"],
        where: { userId: null },
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
