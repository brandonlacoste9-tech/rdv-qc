'use client';

import Link from 'next/link';
import { themes } from '@/lib/theme';
import { PlanxoLogo } from '@/components/PlanxoLogo';

export default function DemoSelectionPage() {
  const c = themes.cognac;

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at 14% 10%, rgba(212,148,78,0.28), transparent 35%), radial-gradient(circle at 88% 8%, rgba(196,127,58,0.2), transparent 38%), #120d09',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        color: c.text,
        fontFamily: "'Inter', sans-serif",
      }}>
      <div style={{ marginBottom: 40 }}>
        <PlanxoLogo size={48} color={c.text} gold={c.gold} />
      </div>

      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1 style={{ fontSize: 42, fontWeight: 700, margin: '0 0 12px', fontFamily: "'Cal Sans', sans-serif" }}>
          Experience Planxo AI
        </h1>
        <p style={{ fontSize: 18, color: c.textMuted, maxWidth: 500 }}>
          Choose how you want to interact with our intelligent scheduling assistant.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 24,
          width: '100%',
          maxWidth: 800,
        }}>
        <Link
          href="/demo/text"
          style={{
            textDecoration: 'none',
            background: c.cardBg,
            border: `1px solid ${c.border}`,
            borderRadius: 24,
            padding: 32,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            transition: 'all 0.2s',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = c.accent;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.borderColor = c.border;
          }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'rgba(212,148,78,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
            }}>
            💬
          </div>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px', color: c.text }}>Text Assistant</h2>
            <p style={{ fontSize: 15, color: c.textMuted, margin: 0, lineHeight: 1.5 }}>
              Book appointments through a natural chat interface. Perfect for quick scheduling on the go.
            </p>
          </div>
          <div style={{ marginTop: 'auto', fontWeight: 600, color: c.accent, display: 'flex', alignItems: 'center', gap: 8 }}>
            Try Text AI <span>→</span>
          </div>
        </Link>

        <Link
          href="/demo/voice"
          style={{
            textDecoration: 'none',
            background: c.cardBg,
            border: `1px solid ${c.border}`,
            borderRadius: 24,
            padding: 32,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            transition: 'all 0.2s',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = c.accent;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.borderColor = c.border;
          }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'rgba(212,148,78,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
            }}>
            🎙️
          </div>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px', color: c.text }}>Voice Assistant</h2>
            <p style={{ fontSize: 15, color: c.textMuted, margin: 0, lineHeight: 1.5 }}>
              Schedule meetings using just your voice. Hands-free, natural conversation with Planxo AI.
            </p>
          </div>
          <div style={{ marginTop: 'auto', fontWeight: 600, color: c.accent, display: 'flex', alignItems: 'center', gap: 8 }}>
            Try Voice AI <span>→</span>
          </div>
        </Link>
      </div>

      <Link
        href="/"
        style={{
          marginTop: 48,
          color: c.textMuted,
          textDecoration: 'none',
          fontSize: 14,
          fontWeight: 500,
        }}>
        ← Back to Home
      </Link>
    </div>
  );
}
