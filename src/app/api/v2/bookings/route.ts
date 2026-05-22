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
    include: { user: true },
  });

  if (!eventType || !eventType.isActive) {
    return NextResponse.json({ error: "Event type not found" }, { status: 404 });
  }

  // Daily cap check
  if (eventType.maxPerDay !== null) {
    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(`${date}T23:59:59`);
    const dailyCount = await prisma.booking.count({
      where: {
        eventTypeId,
        status: { not: "cancelled" },
        startTime: { gte: dayStart, lte: dayEnd },
      },
    });
    if (dailyCount >= eventType.maxPerDay) {
      return NextResponse.json(
        { error: "Aucun créneau disponible — limite quotidienne atteinte." },
        { status: 409 }
      );
    }
  }

  const startTime = new Date(`${date}T${time}:00`);
  const endTime = new Date(startTime.getTime() + eventType.length * 60000);

  // Conflict check (with buffer)
  const bufferBefore = eventType.bufferBefore;
  const bufferAfter = eventType.bufferAfter;
  const conflict = await prisma.booking.findFirst({
    where: {
      eventTypeId,
      status: { not: "cancelled" },
      startTime: { lt: new Date(endTime.getTime() + bufferAfter * 60000) },
      endTime: { gt: new Date(startTime.getTime() - bufferBefore * 60000) },
    },
  });

  if (conflict) {
    return NextResponse.json(
      { error: "Ce créneau n'est plus disponible." },
      { status: 409 }
    );
  }

  // Generate meeting URL based on location type
  let meetingUrl: string | null = null;
  if (eventType.location === "google-meet") {
    meetingUrl = `https://meet.google.com/${randomMeetCode()}`;
  } else if (eventType.location === "zoom") {
    meetingUrl = `https://zoom.us/j/${Math.floor(Math.random() * 9999999999)}`;
  } else if (eventType.location === "teams") {
    meetingUrl = `https://teams.microsoft.com/l/meetup-join/${randomMeetCode()}`;
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
      paid: eventType.price === 0, // free events are auto-paid
      meetingUrl,
    },
  });

  // Fire webhooks
  const userWebhooks = await prisma.webhook.findMany({
    where: { userId: eventType.userId, isActive: true },
  });

  for (const wh of userWebhooks) {
    if (wh.events.includes("booking.created")) {
      fetch(wh.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "booking.created",
          booking: {
            id: booking.id,
            guestName: booking.guestName,
            guestEmail: booking.guestEmail,
            startTime: booking.startTime,
            endTime: booking.endTime,
            status: booking.status,
            meetingUrl: booking.meetingUrl,
          },
          eventType: { id: eventType.id, title: eventType.title, slug: eventType.slug },
        }),
      }).catch(() => {}); // fire-and-forget
    }
  }

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

function randomMeetCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  let code = "";
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 4; j++) code += chars[Math.floor(Math.random() * chars.length)];
    if (i < 2) code += "-";
  }
  return code;
}
