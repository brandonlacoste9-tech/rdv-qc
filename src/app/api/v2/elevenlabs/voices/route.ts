import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ElevenLabs API Key not configured" }, { status: 500 });
    }

    const res = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: {
        "xi-api-key": apiKey,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`ElevenLabs API Error: ${errorText}`);
    }

    const data = await res.json();
    
    // Filter to just returning a clean list of voices
    const voices = data.voices.map((v: any) => ({
      id: v.voice_id,
      name: v.name,
      previewUrl: v.preview_url,
      category: v.category,
      labels: v.labels
    }));

    return NextResponse.json({ voices });
  } catch (error: any) {
    console.error("Error fetching ElevenLabs voices:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
