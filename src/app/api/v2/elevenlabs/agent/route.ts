import { NextResponse } from "next/server";
import { getSignedUrl } from "@/lib/voice/elevenlabs";

export const dynamic = "force-dynamic";

/**
 * Returns the connection config for the ElevenLabs Conversational AI widget.
 *
 * Prefers a server-signed URL (keeps the API key private, supports private agents).
 * Falls back to the public agent ID for client-side connection when no server key
 * is configured.
 */
export async function GET() {
  const publicAgentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

  try {
    const signedUrl = await getSignedUrl();
    if (signedUrl) {
      return NextResponse.json({ signedUrl });
    }

    if (publicAgentId) {
      return NextResponse.json({ agentId: publicAgentId });
    }

    return NextResponse.json(
      {
        error:
          "ElevenLabs agent not configured. Set ELEVENLABS_API_KEY + ELEVENLABS_AGENT_ID, or NEXT_PUBLIC_ELEVENLABS_AGENT_ID.",
      },
      { status: 503 }
    );
  } catch (error: any) {
    // If the signed-url request fails but a public agent exists, fall back to it.
    if (publicAgentId) {
      return NextResponse.json({ agentId: publicAgentId });
    }
    console.error("[ElevenLabs Agent] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get agent config" },
      { status: 500 }
    );
  }
}
