'use client';

import Link from 'next/link';
import { themes } from '@/lib/theme';
import { TextSchedulingAssistant } from '@/components/ai/TextSchedulingAssistant';

export default function DashboardTextAgentPage() {
  const c = themes.cognac;

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at 12% 8%, rgba(212,148,78,0.28), transparent 34%), radial-gradient(circle at 94% 8%, rgba(196,127,58,0.2), transparent 38%), #120d09',
        padding: '28px 18px 42px',
      }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gap: 16 }}>
        <div
          style={{
            border: `1px solid ${c.border}`,
            borderRadius: 18,
            padding: 20,
            background: c.cardBg,
            color: c.text,
            boxShadow: '0 14px 40px rgba(0,0,0,0.35)',
          }}>
          <Link href="/dashboard/voice" style={{ fontSize: 13, color: c.textMuted, textDecoration: 'none' }}>
            {'<- Back to Planxo AI'}
          </Link>
          <h1 style={{ margin: '8px 0 0', fontSize: 30, lineHeight: 1.15, fontFamily: "'Cal Sans', sans-serif", color: c.text }}>
            Text Scheduling Workspace
          </h1>
          <p style={{ margin: '8px 0 0', color: c.textMuted }}>
            This workspace is optimized for fast text scheduling only: choose date, load real slots, and confirm bookings.
          </p>
        </div>

        <TextSchedulingAssistant />
      </div>
    </div>
  );
}
