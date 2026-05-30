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
const DEFAULT_AGENT_ID = "agent_1901ksv92wxhffxbsg30b0mdhkv1";

export async function GET() {
  const agentId =
    process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID ||
    process.env.ELEVENLABS_AGENT_ID ||
    DEFAULT_AGENT_ID;

  try {
    const signedUrl = await getSignedUrl();
    if (signedUrl) {
      return NextResponse.json({ signedUrl, agentId });
    }

    return NextResponse.json({ agentId });
  } catch (error: any) {
    // Signed-url request failed; fall back to the public agent ID.
    console.error("[ElevenLabs Agent] signed-url error, falling back to agentId:", error);
    return NextResponse.json({ agentId });
  }
}
