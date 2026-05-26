import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { text, voiceId } = body;

    if (!text || !voiceId) {
      return NextResponse.json({ error: "Missing text or voiceId" }, { status: 400 });
    }

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("ElevenLabs TTS Error:", errorText);
      throw new Error(`ElevenLabs TTS Error: ${res.statusText}`);
    }

    const audioBuffer = await res.arrayBuffer();

    // Return the raw audio file as a stream/buffer
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": "attachment; filename=reminder.mp3"
      }
    });

  } catch (error: any) {
    console.error("Error generating TTS:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
