import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${request.nextUrl.origin}/login`);

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    // Exchange code for tokens
    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    const redirectUri = `${request.nextUrl.origin}/api/auth/google`;

    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();
    if (tokens.error) {
      return NextResponse.json({ error: tokens.error_description }, { status: 400 });
    }

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Save to connected_calendars
    await supabase.from("connected_calendars").delete().eq("user_id", user.id).eq("provider", "google");
    await supabase.from("connected_calendars").insert({
      user_id: user.id,
      provider: "google",
      account_email: tokens.email || "",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      expires_at: expiresAt,
      delta_token: null,
      sync_status: "idle",
    });

    return NextResponse.redirect(`${request.nextUrl.origin}/dashboard?connected=google`);
  }

  // Redirect to Google
  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const redirectUri = `${request.nextUrl.origin}/api/auth/google`;
  const scope = "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events";
  const authUrl = `${GOOGLE_AUTH_URL}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;

  return NextResponse.redirect(authUrl);
}
