import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/v2/bookings
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { eventTypeId, guestName, guestEmail, guestNotes, date, time } = body;

  if (!eventTypeId || !guestName || !guestEmail || !date || !time) {
    return NextResponse.json(
      { error: "eventTypeId, guestName, guestEmail, date, and time are required" },
      { status: 400 }
    );
  }

  const eventType = await prisma.eventType.findUnique({
    where: { id: eventTypeId },
  });

  if (!eventType) {
    return NextResponse.json({ error: "Event type not found" }, { status: 404 });
  }

  const startTime = new Date(`${date}T${time}:00`);
  const endTime = new Date(startTime.getTime() + eventType.length * 60000);

  // Check for conflicts
  const conflict = await prisma.booking.findFirst({
    where: {
      eventTypeId,
      status: { not: "cancelled" },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  });

  if (conflict) {
    return NextResponse.json(
      { error: "Ce créneau n'est plus disponible." },
      { status: 409 }
    );
  }

  const booking = await prisma.booking.create({
    data: {
      eventTypeId,
      userId: eventType.userId,
      guestName,
      guestEmail,
      guestNotes: guestNotes || "",
      startTime,
      endTime,
      status: "confirmed",
    },
  });

  return NextResponse.json(booking, { status: 201 });
}

// GET /api/v2/bookings?eventTypeId=xxx
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const eventTypeId = searchParams.get("eventTypeId");

  const bookings = await prisma.booking.findMany({
    where: eventTypeId ? { eventTypeId } : {},
    include: { eventType: true },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json(bookings);
}
