'use client';

import { useState } from 'react';
import Link from 'next/link';
import { themes } from '@/lib/theme';
import { TextSchedulingAssistant } from '@/components/ai/TextSchedulingAssistant';
import { VoiceSchedulingAgent } from '@/components/voice/VoiceSchedulingAgent';
import { DashboardLayout } from '@/components/DashboardLayout';

export default function PlanxoAIDashboardPage() {
  const tColors = themes.cognac;
  const [mode, setMode] = useState<'text' | 'voice'>('text');

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 1040, margin: '0 auto', display: 'grid', gap: 24 }}>
        <div
          style={{
            border: `1px solid ${tColors.border}`,
            borderRadius: 18,
            padding: 24,
            background: tColors.cardBg,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 30, lineHeight: 1.15, fontFamily: "'Cal Sans', sans-serif", color: tColors.text }}>Planxo AI Assistant</h1>
              <p style={{ margin: '8px 0 0', color: tColors.textMuted, maxWidth: 680 }}>
                Manage your appointments naturally through text or voice powered by Planxo AI.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, background: 'rgba(0,0,0,0.2)', padding: 4, borderRadius: 12 }}>
              <button 
                onClick={() => setMode('text')}
                style={{ 
                  padding: '8px 16px', 
                  borderRadius: 8, 
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  background: mode === 'text' ? tColors.accent : 'transparent', 
                  color: mode === 'text' ? tColors.accentText : tColors.textMuted,
                  transition: 'all 0.2s'
                }}>
                Text Mode
              </button>
              <button 
                onClick={() => setMode('voice')}
                style={{ 
                  padding: '8px 16px', 
                  borderRadius: 8, 
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  background: mode === 'voice' ? tColors.accent : 'transparent', 
                  color: mode === 'voice' ? tColors.accentText : tColors.textMuted,
                  transition: 'all 0.2s'
                }}>
                Voice Mode
              </button>
            </div>
          </div>
        </div>

        {mode === 'text' ? (
          <TextSchedulingAssistant />
        ) : (
          <div style={{ minHeight: 600 }}>
            <VoiceSchedulingAgent 
              mode="dashboard" 
              professionalName="My Practice"
              username="planxo"
              eventTypeSlug="consultation-30min"
              defaultLanguage="en-US"
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
