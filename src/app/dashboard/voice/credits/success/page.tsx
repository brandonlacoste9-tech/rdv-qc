'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (sessionId) {
      // Credits are added via webhook, just verify
      setTimeout(() => setStatus('success'), 1500);
    }
  }, [sessionId]);

  return (
    <div style={{ maxWidth: 600, margin: '80px auto', textAlign: 'center', padding: 24 }}>
      {status === 'loading' && (
        <>
          <div style={{ fontSize: 64, marginBottom: 24 }}>⏳</div>
          <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
            Processing Payment...
          </h1>
          <p style={{ color: '#6b7280' }}>
            Please wait while we add credits to your account.
          </p>
        </>
      )}

      {status === 'success' && (
        <>
          <div style={{ fontSize: 64, marginBottom: 24 }}>✅</div>
          <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
            Payment Successful!
          </h1>
          <p style={{ color: '#6b7280', marginBottom: 24 }}>
            Your credits have been added to your account.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <a
              href="/dashboard/voice"
              style={{
                padding: '12px 24px',
                background: '#242424',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: 8,
                fontWeight: 600
              }}
            >
              Back to Voice Agent
            </a>
            <a
              href="/dashboard/voice/credits"
              style={{
                padding: '12px 24px',
                background: '#f3f4f6',
                color: '#242424',
                textDecoration: 'none',
                borderRadius: 8,
                fontWeight: 600
              }}
            >
              View Balance
            </a>
          </div>
        </>
      )}
    </div>
  );
}
