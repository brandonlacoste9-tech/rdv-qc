'use client';

import Link from 'next/link';
import { themes } from '@/lib/theme';
import { TextSchedulingAssistant } from '@/components/ai/TextSchedulingAssistant';

export default function PlanxoAIDashboardPage() {
  const tColors = themes.cognac;

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at 12% 10%, rgba(212,148,78,0.28), transparent 36%), radial-gradient(circle at 90% 5%, rgba(196,127,58,0.2), transparent 42%), #120d09',
        color: tColors.text,
        padding: '28px 18px 42px',
      }}>
      <div style={{ maxWidth: 1040, margin: '0 auto', display: 'grid', gap: 16 }}>
        <div
          style={{
            border: `1px solid ${tColors.border}`,
            borderRadius: 18,
            padding: 20,
            background: tColors.cardBg,
            boxShadow: '0 14px 40px rgba(0,0,0,0.35)',
          }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ marginBottom: 6 }}>
                <Link href="/dashboard" style={{ fontSize: 13, color: tColors.textMuted, textDecoration: 'none' }}>
                  {'<- Back to dashboard'}
                </Link>
              </div>
              <h1 style={{ margin: 0, fontSize: 30, lineHeight: 1.15, fontFamily: "'Cal Sans', sans-serif" }}>Planxo AI, text scheduling mode</h1>
              <p style={{ margin: '8px 0 0', color: tColors.textMuted, maxWidth: 680 }}>
                Voice controls have been removed from this area. Bookings are now handled with guided text inputs and real-time availability.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <Link href="/dashboard/voice" style={{ textDecoration: 'none', padding: '8px 12px', borderRadius: 10, border: `1px solid ${tColors.border}`, color: tColors.text, background: tColors.bgSecondary }}>
                Text assistant
              </Link>
              <Link href="/demo/text" style={{ textDecoration: 'none', padding: '8px 12px', borderRadius: 10, background: tColors.accent, color: tColors.accentText, fontWeight: 700 }}>
                Public text demo
              </Link>
            </div>
          </div>
        </div>

        <TextSchedulingAssistant />
      </div>
    </div>
  );
}
