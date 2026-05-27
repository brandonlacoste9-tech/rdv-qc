import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const eventTypeSelect = {
  id: true,
  userId: true,
  title: true,
  slug: true,
  description: true,
  length: true,
  location: true,
  color: true,
  isActive: true,
  minNotice: true,
  bufferBefore: true,
  bufferAfter: true,
  maxPerDay: true,
  price: true,
  currency: true,
  meetingUrl: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");
    const eventSlug = searchParams.get("eventSlug");

    if (!username || !eventSlug) {
      return NextResponse.json(
        { error: "username and eventSlug are required" },
        { status: 400 }
      );
    }

    const publicUser = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        name: true,
        timeZone: true,
      },
    });

    if (!publicUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const eventType = await prisma.eventType.findFirst({
      where: {
        userId: publicUser.id,
        slug: eventSlug,
        isActive: true,
      },
      select: eventTypeSelect,
    });

    if (!eventType) {
      return NextResponse.json({ error: "Event type not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: "success",
      data: {
        ...eventType,
        user: {
          name: publicUser.name || publicUser.username,
          username: publicUser.username,
          timeZone: publicUser.timeZone || "America/Toronto",
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching public booking data:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
