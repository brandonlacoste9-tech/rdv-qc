import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${request.nextUrl.origin}/login`);

  await supabase.from("connected_calendars").delete().eq("user_id", user.id).eq("provider", "google");
  return NextResponse.redirect(`${request.nextUrl.origin}/settings?tab=calendars&disconnected=google`);
}
