'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ReschedulePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleReschedule = async () => {
    if (!token || !newStartTime || !newEndTime) {
      setError('Tous les champs sont requis');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/booking/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newStartTime, newEndTime, reason }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Erreur lors de la reprogrammation');
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
          <div className="text-6xl mb-6">📅</div>
          <h1 className="text-3xl font-semibold mb-4">Rendez-vous reprogrammé</h1>
          <p className="text-zinc-400">Votre rendez-vous a été mis à jour. Un email de confirmation vous a été envoyé.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
      <div className="max-w-md w-full p-8 bg-zinc-900 rounded-2xl border border-zinc-800">
        <h1 className="text-3xl font-semibold mb-2">Reprogrammer le rendez-vous</h1>
        <p className="text-zinc-400 mb-8">Choisissez un nouveau créneau.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Nouvelle date/heure de début</label>
            <input
              type="datetime-local"
              value={newStartTime}
              onChange={(e) => setNewStartTime(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-zinc-600"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">Nouvelle date/heure de fin</label>
            <input
              type="datetime-local"
              value={newEndTime}
              onChange={(e) => setNewEndTime(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-zinc-600"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">Raison (optionnel)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
              rows={2}
              placeholder="Changement de disponibilité..."
            />
          </div>

          {error && <div className="text-red-400 text-sm">{error}</div>}

          <button
            onClick={handleReschedule}
            disabled={loading || !token || !newStartTime || !newEndTime}
            className="w-full bg-white hover:bg-zinc-200 disabled:bg-zinc-700 text-black font-medium py-4 rounded-xl transition-colors"
          >
            {loading ? 'Reprogrammation en cours...' : 'Confirmer la reprogrammation'}
          </button>
        </div>
      </div>
    </div>
  );
}
