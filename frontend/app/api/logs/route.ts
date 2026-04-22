import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/logs — get all logs across all user projects with filtering & pagination.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all project IDs for the user
  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true },
  });

  const projectIds = projects.map((p) => p.id);
  const projectNameMap: Record<string, string> = {};
  for (const p of projects) {
    projectNameMap[p.id] = p.name;
  }

  if (projectIds.length === 0) {
    return NextResponse.json({ logs: [], total: 0, limit: 50, offset: 0 });
  }

  const { searchParams } = new URL(request.url);
  const level = searchParams.get("level");
  const search = searchParams.get("search");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 500);
  const offset = parseInt(searchParams.get("offset") ?? "0");

  const where: Record<string, unknown> = { projectId: { in: projectIds } };
  if (level && level !== "all") {
    where.level = level;
  }
  if (search) {
    where.message = { contains: search };
  }

  const [logs, total] = await Promise.all([
    prisma.log.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: limit,
      skip: offset,
      include: { project: { select: { name: true } } },
    }),
    prisma.log.count({ where }),
  ]);

  return NextResponse.json({
    logs: logs.map((l) => ({
      id: l.id,
      level: l.level,
      message: l.message,
      metadata: l.metadata,
      source: l.source,
      timestamp: l.timestamp,
      projectId: l.projectId,
      projectName: l.project.name,
    })),
    total,
    limit,
    offset,
  });
}
