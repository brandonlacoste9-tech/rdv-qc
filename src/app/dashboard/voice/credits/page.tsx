'use client';

import { useState, useEffect } from 'react';
import { themes } from '@/lib/theme';

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  description: string;
  popular: boolean;
}

const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 1000,
    price: 1000,
    description: '~66 minutes of calls',
    popular: false
  },
  {
    id: 'professional',
    name: 'Professional',
    credits: 2750,
    price: 2500,
    description: '~183 minutes of calls',
    popular: true
  },
  {
    id: 'business',
    name: 'Business',
    credits: 6000,
    price: 5000,
    description: '~400 minutes of calls',
    popular: false
  }
];

export default function CreditsPage() {
  const c = themes.cognac;
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    fetchBalance();
  }, []);

  async function fetchBalance() {
    try {
      const res = await fetch('/api/voice/credits');
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance);
      }
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    } finally {
      setLoading(false);
    }
  }

  async function purchasePackage(package_: CreditPackage) {
    setPurchasing(package_.id);
    try {
      // Get user info first
      const meRes = await fetch('/api/me');
      const meData = await meRes.json();
      
      const res = await fetch('/api/voice/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: package_.id,
          userId: meData.profile?.id,
          userEmail: meData.profile?.email
        })
      });

      if (!res.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      console.error('Purchase error:', err);
      alert('Failed to start purchase. Please try again.');
    } finally {
      setPurchasing(null);
    }
  }

  const formatCredits = (credits: number) => {
    return `$${(credits / 100).toFixed(2)}`;
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24, color: c.text }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <a href="/dashboard/voice" style={{ color: c.textMuted, textDecoration: 'none' }}>
          ← Back to Voice Agent
        </a>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginTop: 16 }}>
          Voice Credits
        </h1>
        <p style={{ color: c.textMuted }}>
          Purchase credits to make AI phone calls
        </p>
      </div>

      {/* Balance Card */}
      <div style={{
        background: `linear-gradient(135deg, ${c.bg}, ${c.bgSecondary})`,
        border: `1px solid ${c.border}`,
        borderRadius: 16,
        padding: 32,
        marginBottom: 32,
        color: c.text
      }}>
        <div style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.7 }}>
          Current Balance
        </div>
        <div style={{ fontSize: 48, fontWeight: 700, marginTop: 8, color: c.accent }}>
          {loading ? 'Loading...' : formatCredits(balance || 0)}
        </div>
        <div style={{ marginTop: 8, opacity: 0.7 }}>
          {balance ? `${balance} credits` : '0 credits'}
        </div>
        <div style={{ marginTop: 16, fontSize: 14, opacity: 0.6 }}>
          ~{Math.floor((balance || 0) / 15)} minutes of calls remaining
        </div>
      </div>

      {/* Pricing */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
          Purchase Credits
        </h2>
        <p style={{ color: c.textMuted }}>
          Choose a package. Credits never expire.
        </p>
      </div>

      {/* Packages Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 24,
        marginBottom: 32
      }}>
        {CREDIT_PACKAGES.map((pkg) => (
          <div
            key={pkg.id}
            style={{
              background: c.cardBg,
              border: `2px solid ${pkg.popular ? c.accent : c.border}`,
              borderRadius: 12,
              padding: 24,
              position: 'relative',
              color: c.text,
            }}
          >
            {pkg.popular && (
              <div style={{
                position: 'absolute',
                top: -12,
                left: '50%',
                transform: 'translateX(-50%)',
                background: c.accent,
                color: c.accentText,
                padding: '4px 16px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600
              }}>
                Most Popular
              </div>
            )}
            
            <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
              {pkg.name}
            </h3>
            
            <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 4 }}>
              {formatCredits(pkg.price)}
            </div>
            
            <div style={{ color: c.textMuted, marginBottom: 16 }}>
              {pkg.credits.toLocaleString()} credits
            </div>
            
            <div style={{
              background: c.bgSecondary,
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
              fontSize: 14,
              color: c.textMuted
            }}>
              {pkg.description}
            </div>
            
            <button
              onClick={() => purchasePackage(pkg)}
              disabled={purchasing === pkg.id}
              style={{
                width: '100%',
                padding: '12px 24px',
                background: pkg.popular ? c.accent : c.bgSecondary,
                color: pkg.popular ? c.accentText : c.text,
                border: 'none',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                cursor: purchasing === pkg.id ? 'not-allowed' : 'pointer',
                opacity: purchasing === pkg.id ? 0.7 : 1
              }}
            >
              {purchasing === pkg.id ? 'Processing...' : 'Purchase'}
            </button>
          </div>
        ))}
      </div>

      {/* Info */}
      <div style={{
        background: c.cardBg,
        border: `1px solid ${c.border}`,
        borderRadius: 12,
        padding: 24
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
          How Credits Work
        </h3>
        <ul style={{ color: c.textMuted, paddingLeft: 20, lineHeight: 1.8 }}>
          <li>1 credit = $0.01 USD</li>
          <li>Calls cost ~$0.15 per minute (15 credits)</li>
          <li>Credits are deducted in real-time during calls</li>
          <li>Credits never expire</li>
          <li>Refunds available within 7 days of purchase</li>
          <li>You'll receive email notifications when your balance is low</li>
        </ul>
      </div>
    </div>
  );
}
