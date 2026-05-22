import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET /api/v2/event-types
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username") || "planxo";
  const slug = searchParams.get("eventSlug");

  const { data: user } = await supabase.from("User").select("id").eq("username", username).single();
  if (!user) return NextResponse.json({ status: "error", error: { message: "User not found" } }, { status: 404 });

  let q = supabase.from("EventType").select("*").eq("userId", user.id).eq("isActive", true).order("createdAt", { ascending: false });
  if (slug) q = q.eq("slug", slug);

  const { data, error } = await q;
  if (error) return NextResponse.json({ status: "error", error: { message: error.message } }, { status: 500 });

  const result = (data || []).map((et: any) => ({
    id: et.id,
    title: et.title,
    slug: et.slug,
    description: et.description || "",
    length: et.length,
    lengthInMinutes: et.length,
    location: et.location,
    color: et.color,
    isActive: et.isActive,
    minNotice: et.minNotice,
    bufferBefore: et.bufferBefore || 0,
    bufferAfter: et.bufferAfter || 0,
    maxPerDay: et.maxPerDay,
    price: et.price,
    currency: et.currency,
    userId: et.userId,
    createdAt: et.createdAt,
  }));

  return NextResponse.json({ status: "success", data: result });
}

// POST /api/v2/event-types
export async function POST(request: NextRequest) {
  const body = await request.json();
  const username = body.username || "planxo";

  const { data: user } = await supabase.from("User").select("id").eq("username", username).single();
  if (!user) return NextResponse.json({ status: "error", error: { message: "User not found" } }, { status: 404 });

  const slug = body.slug || body.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const { data, error } = await supabase.from("EventType").insert({
    userId: user.id,
    title: body.title,
    slug,
    description: body.description || "",
    length: body.length || body.lengthInMinutes || 30,
    location: body.location || "google-meet",
    color: body.color || "#242424",
    bufferBefore: body.bufferBefore || 0,
    bufferAfter: body.bufferAfter || 0,
    maxPerDay: body.maxPerDay || null,
    price: body.price || 0,
    currency: body.currency || "cad",
    updatedAt: new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ status: "error", error: { message: error.message } }, { status: 500 });

  return NextResponse.json({
    status: "success",
    data: { id: data.id, title: data.title, slug: data.slug, length: data.length, location: data.location },
  }, { status: 201 });
}
