import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  let userQuery = supabase.from("users").select("*");

  if (username) {
    userQuery = userQuery.eq("username", username);
  } else {
    userQuery = userQuery.eq("email", "info@planxo.ca");
  }

  const { data: user } = await userQuery.single();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { data: eventTypes } = await supabase
    .from("EventType")
    .select("*")
    .eq("userId", user.id)
    .eq("isActive", true)
    .order("createdAt", { ascending: false });

  const { data: schedules } = await supabase
    .from("Schedule")
    .select("*, intervals:Availability(*)")
    .eq("userId", user.id)
    .eq("isDefault", true);

  return NextResponse.json({
    ...user,
    eventTypes: eventTypes || [],
    schedules: schedules || [],
  });
}
