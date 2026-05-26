import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET — Fetch a single event type by id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const eventType = await prisma.eventType.findUnique({
      where: { id: id }
    });

    if (!eventType || eventType.userId !== user.id || !eventType.isActive) {
      return NextResponse.json({ error: "Event type not found" }, { status: 404 });
    }

    return NextResponse.json({ status: "success", data: eventType });
  } catch (error: any) {
    console.error("Error fetching event type:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// PATCH — Update event type
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Verify ownership
    const existing = await prisma.eventType.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: "Event type not found" }, { status: 404 });
    }

    const updates: any = {};
    const allowedFields = ["title", "slug", "description", "length", "location", "color", "price", "currency", "bufferBefore", "bufferAfter", "maxPerDay", "isActive"];
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const eventType = await prisma.eventType.update({
      where: { id },
      data: updates
    });

    return NextResponse.json({ status: "success", data: eventType });
  } catch (error: any) {
    console.error("Error updating event type:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// DELETE — Remove event type (soft delete via isActive=false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const existing = await prisma.eventType.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: "Event type not found" }, { status: 404 });
    }

    await prisma.eventType.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ status: "success", data: { id } });
  } catch (error: any) {
    console.error("Error deleting event type:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
