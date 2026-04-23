import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message, projectId } = await request.json();

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  // If projectId is not provided, get the first project of the user
  let targetProjectId = projectId;
  if (!targetProjectId) {
    const project = await prisma.project.findFirst({
      where: { userId: session.user.id },
    });
    if (!project) {
      return NextResponse.json({ error: "No project found" }, { status: 404 });
    }
    targetProjectId = project.id;
  } else {
    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: { id: targetProjectId, userId: session.user.id },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
  }

  const project = await prisma.project.findUnique({
    where: { id: targetProjectId },
    select: { apiKey: true },
  });

  if (!project?.apiKey) {
    return NextResponse.json({ error: "Project API Key not found" }, { status: 404 });
  }

  try {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    const response = await fetch(`${backendUrl}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": project.apiKey,
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: error.detail || "Backend error" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ response: data.response });
  } catch (error) {
    console.error("AI Chat Error:", error);
    return NextResponse.json({ error: "Failed to connect to AI backend" }, { status: 500 });
  }
}
