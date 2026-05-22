import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await prisma.user.findFirst({
    where: { email: "info@planxo.ca" },
    include: {
      eventTypes: true,
      schedules: { include: { intervals: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}
