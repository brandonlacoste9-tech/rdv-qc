import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const eventTypes = await prisma.eventType.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(eventTypes);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const user = await prisma.user.findFirst();

  if (!user) {
    return NextResponse.json({ error: "No user found" }, { status: 400 });
  }

  const eventType = await prisma.eventType.create({
    data: {
      userId: user.id,
      title: body.title,
      slug: body.slug || body.title.toLowerCase().replace(/\s+/g, "-"),
      description: body.description || "",
      length: body.length || 30,
      location: body.location || "google-meet",
      color: body.color || "#242424",
    },
  });

  return NextResponse.json(eventType, { status: 201 });
}
