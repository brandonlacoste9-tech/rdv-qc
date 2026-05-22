import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/v2/slots?eventTypeId=xxx&date=2026-05-25&timeZone=America/Toronto
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const eventTypeId = searchParams.get("eventTypeId");
  const dateStr = searchParams.get("date"); // YYYY-MM-DD
  const timeZone = searchParams.get("timeZone") || "America/Toronto";

  if (!eventTypeId || !dateStr) {
    return NextResponse.json(
      { error: "eventTypeId and date are required" },
      { status: 400 }
    );
  }

  const eventType = await prisma.eventType.findUnique({
    where: { id: eventTypeId },
    include: {
      user: {
        include: {
          schedules: {
            where: { isDefault: true },
            include: { intervals: { where: { isActive: true } } },
          },
        },
      },
    },
  });

  if (!eventType) {
    return NextResponse.json({ error: "Event type not found" }, { status: 404 });
  }

  // Find day of week (0=Sun, 6=Sat)
  const date = new Date(dateStr + "T12:00:00");
  const dayOfWeek = date.getDay();

  // Get availability for this day
  const schedule = eventType.user.schedules[0];
  if (!schedule) {
    return NextResponse.json({ slots: [] });
  }

  const dayAvail = schedule.intervals.filter(
    (i) => i.dayOfWeek === dayOfWeek
  );

  if (dayAvail.length === 0) {
    return NextResponse.json({ slots: [] });
  }

  // Get existing bookings for this event type on this date
  const dayStart = new Date(dateStr + "T00:00:00");
  const dayEnd = new Date(dateStr + "T23:59:59");

  const bookings = await prisma.booking.findMany({
    where: {
      eventTypeId,
      status: { not: "cancelled" },
      startTime: { gte: dayStart, lte: dayEnd },
    },
  });

  // Generate 15-min slots
  const slots: string[] = [];
  for (const avail of dayAvail) {
    const [startH, startM] = avail.startTime.split(":").map(Number);
    const [endH, endM] = avail.endTime.split(":").map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;
    const slotDuration = eventType.length;
    const interval = 15; // 15-min granularity

    for (let m = startMin; m + slotDuration <= endMin; m += interval) {
      const slotH = Math.floor(m / 60);
      const slotM = m % 60;
      const slotTime = `${String(slotH).padStart(2, "0")}:${String(slotM).padStart(2, "0")}`;

      // Check if slot conflicts with existing bookings
      const slotStart = new Date(dateStr + `T${slotTime}:00`);
      const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);

      const conflict = bookings.some(
        (b) => slotStart < b.endTime && slotEnd > b.startTime
      );

      if (!conflict) {
        slots.push(slotTime);
      }
    }
  }

  return NextResponse.json({
    eventTypeId,
    date: dateStr,
    timeZone,
    length: eventType.length,
    slots,
  });
}
