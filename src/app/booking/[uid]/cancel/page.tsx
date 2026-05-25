'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function CancelPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleCancel = async () => {
    if (!token) {
      setError('Token manquant');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/booking/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, reason, actor: 'ATTENDEE' }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Erreur lors de l\'annulation');
      }
    } catch (e) {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        <div className="max-w-md w-full p-8 bg-zinc-900 rounded-2xl border border-zinc-800 text-center">
          <div className="text-6xl mb-6">✅</div>
          <h1 className="text-3xl font-semibold mb-4">Rendez-vous annulé</h1>
          <p className="text-zinc-400">Votre rendez-vous a été annulé avec succès. Un email de confirmation vous a été envoyé.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
      <div className="max-w-md w-full p-8 bg-zinc-900 rounded-2xl border border-zinc-800">
        <h1 className="text-3xl font-semibold mb-2">Annuler le rendez-vous</h1>
        <p className="text-zinc-400 mb-8">Cette action est irréversible.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Raison (optionnel)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
              rows={3}
              placeholder="Changement de plan..."
            />
          </div>

          {error && <div className="text-red-400 text-sm">{error}</div>}

          <button
            onClick={handleCancel}
            disabled={loading || !token}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 text-white font-medium py-4 rounded-xl transition-colors"
          >
            {loading ? 'Annulation en cours...' : 'Confirmer l\'annulation'}
          </button>
        </div>
      </div>
    </div>
  );
}
