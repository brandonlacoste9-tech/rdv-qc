import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET /api/v2/event-types/:id
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: et } = await supabase.from("EventType").select("*").eq("id", id).single();
  if (!et) return NextResponse.json({ status: "error", error: { message: "Not found" } }, { status: 404 });

  return NextResponse.json({
    status: "success",
    data: {
      id: et.id, title: et.title, slug: et.slug, description: et.description || "",
      length: et.length, lengthInMinutes: et.length, location: et.location,
      color: et.color, isActive: et.isActive, minNotice: et.minNotice,
      bufferBefore: et.bufferBefore, bufferAfter: et.bufferAfter,
      maxPerDay: et.maxPerDay, price: et.price, currency: et.currency,
      userId: et.userId, createdAt: et.createdAt, updatedAt: et.updatedAt,
    },
  });
}

// PATCH /api/v2/event-types/:id
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const { data: updated, error } = await supabase.from("EventType").update({
    ...(body.title && { title: body.title }),
    ...(body.description !== undefined && { description: body.description }),
    ...(body.length && { length: body.length }),
    ...(body.location && { location: body.location }),
    ...(body.isActive !== undefined && { isActive: body.isActive }),
    ...(body.bufferBefore !== undefined && { bufferBefore: body.bufferBefore }),
    ...(body.bufferAfter !== undefined && { bufferAfter: body.bufferAfter }),
    ...(body.maxPerDay !== undefined && { maxPerDay: body.maxPerDay }),
    ...(body.price !== undefined && { price: body.price }),
    ...(body.currency && { currency: body.currency }),
    updatedAt: new Date().toISOString(),
  }).eq("id", id).select().single();

  if (error) return NextResponse.json({ status: "error", error: { message: error.message } }, { status: 500 });
  if (!updated) return NextResponse.json({ status: "error", error: { message: "Not found" } }, { status: 404 });

  return NextResponse.json({ status: "success", data: { id: updated.id, title: updated.title, slug: updated.slug } });
}

// DELETE /api/v2/event-types/:id
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabase.from("EventType").delete().eq("id", id);
  if (error) return NextResponse.json({ status: "error", error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ status: "success", data: { id } });
}
