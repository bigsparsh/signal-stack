import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/projects — list all projects for the authenticated user.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { logs: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Compute per-project error counts for error rate
  const projectsWithStats = await Promise.all(
    projects.map(async (project) => {
      const errorCount = await prisma.log.count({
        where: {
          projectId: project.id,
          level: { in: ["error", "fatal"] },
        },
      });
      const totalLogs = project._count.logs;
      return {
        id: project.id,
        name: project.name,
        description: project.description,
        apiKey: project.apiKey,
        totalLogs,
        errorCount,
        errorRate: totalLogs > 0 ? Math.round((errorCount / totalLogs) * 10000) / 100 : 0,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      };
    })
  );

  return NextResponse.json(projectsWithStats);
}

/**
 * POST /api/projects — create a new project.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Project name is required" }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      userId: session.user.id,
    },
  });

  return NextResponse.json(project, { status: 201 });
}
