import { NextRequest, NextResponse } from "next/server";

// Google OAuth 2.0 endpoints
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

// GET /api/auth/google — initiate OAuth flow
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state"); // passed through from initial request

  // Step 2: Exchange code for tokens
  if (code) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${request.nextUrl.origin}/api/auth/google`;

    if (!clientId || !clientSecret) {
      return NextResponse.json({
        error: "Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
      }, { status: 500 });
    }

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
      return NextResponse.json({ error: tokens.error_description || tokens.error }, { status: 400 });
    }

    // Return tokens — store these in your database
    return NextResponse.redirect(
      `${request.nextUrl.origin}/dashboard?calendar=google&connected=true`
    );
  }

  // Step 1: Redirect to Google
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({
      error: "Google OAuth not configured. Set GOOGLE_CLIENT_ID.",
    }, { status: 500 });
  }

  const redirectUri = `${request.nextUrl.origin}/api/auth/google`;
  const scope = "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events";
  const authUrl = `${GOOGLE_AUTH_URL}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent&state=${userId || "user"}`;

  return NextResponse.redirect(authUrl);
}
