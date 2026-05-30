// Required env vars:
// ELEVENLABS_API_KEY              — your ElevenLabs API key (server-side: signed URL, voices, TTS)
// ELEVENLABS_AGENT_ID             — the Conversational AI agent ID (server-side signed-url request)
// NEXT_PUBLIC_ELEVENLABS_AGENT_ID — public agent ID for the client SDK (fallback when no server key)

const ELEVENLABS_API = "https://api.elevenlabs.io/v1";

/**
 * Request a short-lived signed URL for a (possibly private) Conversational AI agent.
 * The browser SDK connects with this via `startSession({ signedUrl })`, so the API
 * key never leaves the server. Returns null if the server isn't configured.
 */
export async function getSignedUrl(): Promise<string | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!apiKey || !agentId) return null;

  const res = await fetch(
    `${ELEVENLABS_API}/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`,
    { headers: { "xi-api-key": apiKey } }
  );

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`ElevenLabs signed-url error: ${res.status} ${detail}`);
  }

  const data = await res.json();
  return data.signed_url as string;
}
