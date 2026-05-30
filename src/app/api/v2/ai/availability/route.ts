import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username") || "planxo";
  const eventTypeSlug = searchParams.get("eventTypeSlug") || "consultation-30min";
  const date = searchParams.get("date"); // YYYY-MM-DD
  const timeZone = searchParams.get("timeZone") || "America/Toronto";

  if (!date) {
    return NextResponse.json({ error: "date parameter is required (YYYY-MM-DD)" }, { status: 400 });
  }

  try {
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const host = request.headers.get("host");
    const baseUrl = `${protocol}://${host}`;
    
    const slotsUrl = new URL(`${baseUrl}/api/v2/slots`);
    slotsUrl.searchParams.set("username", username);
    slotsUrl.searchParams.set("eventTypeSlug", eventTypeSlug);
    slotsUrl.searchParams.set("startTime", `${date}T00:00:00.000Z`);
    slotsUrl.searchParams.set("endTime", `${date}T23:59:59.999Z`);
    slotsUrl.searchParams.set("timeZone", timeZone);

    const res = await fetch(slotsUrl.toString());
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.message || "Failed to fetch slots");
    }

    // The real slots API returns data: { "YYYY-MM-DD": ["ISO-STRING", ...] }
    const daySlots = data.data?.[date] || [];
    
    const availableTimes = daySlots.map((iso: string) => {
      const d = new Date(iso);
      return d.toLocaleTimeString("en-US", { 
        hour: '2-digit', 
        minute: '2-digit', 
        timeZone 
      });
    });

    return NextResponse.json({
      message: `Available slots for ${date} in ${timeZone}`,
      date,
      timeZone,
      availableTimes,
      rawSlots: daySlots
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
