import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // Look up user in the public.users table by uuid
  const { data: profile } = await supabase
    .from("users")
    .select("id, uuid, username, name, email, timeZone, completedOnboarding")
    .eq("uuid", user.id)
    .single();

  return NextResponse.json({
    ...user,
    profile: profile || null,
  });
}

export async function PUT(request: NextRequest) {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const { name, username, timeZone } = body;

  // Check if user already exists
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("uuid", user.id)
    .single();

  if (existing) {
    await supabase
      .from("users")
      .update({
        name: name || user.user_metadata?.full_name || user.email?.split("@")[0] || "",
        username: username || "",
        timeZone: timeZone || "America/Toronto",
        completedOnboarding: true,
      })
      .eq("uuid", user.id);
  } else {
    await supabase
      .from("users")
      .insert({
        uuid: user.id,
        email: user.email || "",
        name: name || user.user_metadata?.full_name || user.email?.split("@")[0] || "",
        username: username || "",
        timeZone: timeZone || "America/Toronto",
        completedOnboarding: true,
      });
  }

  return NextResponse.json({ status: "success" });
}
