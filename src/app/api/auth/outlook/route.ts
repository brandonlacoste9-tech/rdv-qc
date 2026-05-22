import { NextRequest, NextResponse } from "next/server";

const OUTLOOK_AUTH_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
const OUTLOOK_TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state");

  if (code) {
    const clientId = process.env.OUTLOOK_CLIENT_ID;
    const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
    const redirectUri = `${request.nextUrl.origin}/api/auth/outlook`;

    if (!clientId || !clientSecret) {
      return NextResponse.json({
        error: "Outlook OAuth not configured. Set OUTLOOK_CLIENT_ID and OUTLOOK_CLIENT_SECRET.",
      }, { status: 500 });
    }

    const tokenRes = await fetch(OUTLOOK_TOKEN_URL, {
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

    return NextResponse.redirect(`${request.nextUrl.origin}/dashboard?calendar=outlook&connected=true`);
  }

  const clientId = process.env.OUTLOOK_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({
      error: "Outlook OAuth not configured. Set OUTLOOK_CLIENT_ID.",
    }, { status: 500 });
  }

  const redirectUri = `${request.nextUrl.origin}/api/auth/outlook`;
  const scope = "https://graph.microsoft.com/Calendars.Read https://graph.microsoft.com/Calendars.ReadWrite";
  const authUrl = `${OUTLOOK_AUTH_URL}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${userId || "user"}`;

  return NextResponse.redirect(authUrl);
}
