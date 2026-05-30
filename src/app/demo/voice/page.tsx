'use client';

import Link from 'next/link';
import { themes } from '@/lib/theme';
import { VoiceSchedulingAgent } from '@/components/voice/VoiceSchedulingAgent';

export default function VoiceDemoPage() {
  const c = themes.cognac;

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at 14% 10%, rgba(212,148,78,0.28), transparent 35%), radial-gradient(circle at 88% 8%, rgba(196,127,58,0.2), transparent 38%), #120d09',
        padding: '34px 20px 48px',
      }}>
      <div style={{ maxWidth: 980, margin: '0 auto', display: 'grid', gap: 16 }}>
        <div
          style={{
            borderRadius: 18,
            border: `1px solid ${c.border}`,
            background: c.cardBg,
            padding: 20,
            color: c.text,
            boxShadow: '0 14px 40px rgba(0,0,0,0.35)',
          }}>
          <div style={{ marginBottom: 6 }}>
            <Link href="/" style={{ color: c.textMuted, textDecoration: 'none', fontSize: 13 }}>
              {'<- Back home'}
            </Link>
          </div>
          <h1 style={{ margin: 0, fontSize: 31, lineHeight: 1.12, fontFamily: "'Cal Sans', sans-serif" }}>
            Planxo AI Voice Assistant
          </h1>
          <p style={{ margin: '8px 0 0', color: c.textMuted, maxWidth: 760 }}>
            Book appointments naturally through our AI-powered voice assistant.
          </p>
        </div>

        <div style={{ minHeight: 600 }}>
          <VoiceSchedulingAgent 
            mode="demo" 
            professionalName="Planxo AI"
            username="planxo"
            eventTypeSlug="consultation-30min"
            defaultLanguage="en-US"
          />
        </div>
      </div>
    </div>
  );
}
