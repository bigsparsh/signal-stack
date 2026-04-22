import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/dashboard/stats — aggregated stats across all user projects.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Get all projects for this user
  const projects = await prisma.project.findMany({
    where: { userId },
    select: { id: true, name: true },
  });

  const projectIds = projects.map((p) => p.id);

  if (projectIds.length === 0) {
    return NextResponse.json({
      totalLogs: 0,
      errorCount: 0,
      warnCount: 0,
      errorRate: 0,
      projectCount: 0,
      recentLogs: [],
      levelBreakdown: {},
      sourceBreakdown: [],
    });
  }

  // Aggregated counts
  const [totalLogs, errorCount, warnCount] = await Promise.all([
    prisma.log.count({ where: { projectId: { in: projectIds } } }),
    prisma.log.count({
      where: { projectId: { in: projectIds }, level: { in: ["error", "fatal"] } },
    }),
    prisma.log.count({
      where: { projectId: { in: projectIds }, level: "warn" },
    }),
  ]);

  // Recent logs across all projects
  const recentLogs = await prisma.log.findMany({
    where: { projectId: { in: projectIds } },
    orderBy: { timestamp: "desc" },
    take: 10,
    include: { project: { select: { name: true } } },
  });

  // Level breakdown
  const allLogs = await prisma.log.groupBy({
    by: ["level"],
    where: { projectId: { in: projectIds } },
    _count: { id: true },
  });
  const levelBreakdown: Record<string, number> = {};
  for (const row of allLogs) {
    levelBreakdown[row.level] = row._count.id;
  }

  // Source breakdown (top sources by error count)
  const sourceLogs = await prisma.log.groupBy({
    by: ["source"],
    where: {
      projectId: { in: projectIds },
      level: { in: ["error", "fatal"] },
      source: { not: null },
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 5,
  });

  return NextResponse.json({
    totalLogs,
    errorCount,
    warnCount,
    errorRate: totalLogs > 0 ? Math.round((errorCount / totalLogs) * 10000) / 100 : 0,
    projectCount: projects.length,
    recentLogs: recentLogs.map((l) => ({
      id: l.id,
      level: l.level,
      message: l.message,
      source: l.source,
      timestamp: l.timestamp,
      projectName: l.project.name,
    })),
    levelBreakdown,
    sourceBreakdown: sourceLogs.map((s) => ({
      source: s.source,
      count: s._count.id,
    })),
  });
}
