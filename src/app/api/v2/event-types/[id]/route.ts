import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const eventType = await prisma.eventType.findUnique({ where: { id } });
  if (!eventType) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(eventType);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const eventType = await prisma.eventType.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description,
      length: body.length,
      location: body.location,
      isActive: body.isActive,
    },
  });
  return NextResponse.json(eventType);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.eventType.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
