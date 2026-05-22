import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/v2/slots?eventTypeId=xxx&date=2026-05-25&timeZone=America/Toronto
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const eventTypeId = searchParams.get("eventTypeId");
  const dateStr = searchParams.get("date");
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

  if (!eventType || !eventType.isActive) {
    return NextResponse.json({ error: "Event type not found" }, { status: 404 });
  }

  const date = new Date(dateStr + "T12:00:00");
  const dayOfWeek = date.getDay();

  const schedule = eventType.user.schedules[0];
  if (!schedule) return NextResponse.json({ slots: [] });

  const dayAvail = schedule.intervals.filter((i) => i.dayOfWeek === dayOfWeek);
  if (dayAvail.length === 0) return NextResponse.json({ slots: [] });

  // Get existing bookings for this day
  const dayStart = new Date(dateStr + "T00:00:00");
  const dayEnd = new Date(dateStr + "T23:59:59");
  const bookings = await prisma.booking.findMany({
    where: {
      eventTypeId,
      status: { not: "cancelled" },
      startTime: { gte: dayStart, lte: dayEnd },
    },
  });

  // Daily cap check
  const bufferBefore = eventType.bufferBefore;
  const bufferAfter = eventType.bufferAfter;
  const maxPerDay = eventType.maxPerDay;

  const dailyBookings = bookings.filter((b) => b.status === "confirmed").length;
  const dailyCapReached = maxPerDay !== null && dailyBookings >= maxPerDay;

  if (dailyCapReached) {
    return NextResponse.json({
      eventTypeId, date: dateStr, timeZone, length: eventType.length,
      slots: [],
      dailyCapReached: true,
      dailyBookings,
      maxPerDay,
    });
  }

  // Generate slots with buffer awareness
  const slots: string[] = [];
  const slotDuration = eventType.length;
  const interval = 15;

  for (const avail of dayAvail) {
    const [startH, startM] = avail.startTime.split(":").map(Number);
    const [endH, endM] = avail.endTime.split(":").map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;

    for (let m = startMin; m + slotDuration <= endMin; m += interval) {
      const slotH = Math.floor(m / 60);
      const slotM = m % 60;
      const slotTime = `${String(slotH).padStart(2, "0")}:${String(slotM).padStart(2, "0")}`;

      // The slot window (excluding buffer)
      const slotStart = new Date(dateStr + `T${slotTime}:00`);
      const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);

      // Expanded window including buffer
      const blockStart = new Date(slotStart.getTime() - bufferBefore * 60000);
      const blockEnd = new Date(slotEnd.getTime() + bufferAfter * 60000);

      // Check conflicts against expanded window
      const conflict = bookings.some((b) => {
        const bStart = new Date(b.startTime);
        const bEnd = new Date(b.endTime);
        // Expand existing booking by its own buffer too
        const bBlockStart = new Date(bStart.getTime() - bufferBefore * 60000);
        const bBlockEnd = new Date(bEnd.getTime() + bufferAfter * 60000);
        return blockStart < bBlockEnd && blockEnd > bBlockStart;
      });

      if (!conflict) slots.push(slotTime);
    }
  }

  return NextResponse.json({
    eventTypeId, date: dateStr, timeZone,
    length: eventType.length,
    bufferBefore, bufferAfter,
    maxPerDay, dailyBookings,
    dailyCapReached: false,
    price: eventType.price,
    currency: eventType.currency,
    slots,
  });
}
