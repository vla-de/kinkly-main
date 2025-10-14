import React, { useState } from 'react';

const API_BASE = 'https://kinkly-backend.onrender.com';

const PreloaderLanding: React.FC = () => {
  const [mode, setMode] = useState<'code' | 'waitlist'>('code');
  const [elitePasscode, setElitePasscode] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!elitePasscode.trim()) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/validate-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: elitePasscode.trim().toUpperCase() })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Code ungültig.');
      } else {
        window.location.href = `/event?elitePasscode=${elitePasscode.trim().toUpperCase()}`;
      }
    } catch (err) {
      setError('Netzwerkfehler. Bitte erneut versuchen.');
    } finally {
      setLoading(false);
    }
  };

  const submitWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/api/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });
      if (res.ok) {
        setMessage('Willkommen im Kreis – wir melden uns.');
        setEmail('');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Ein Fehler ist aufgetreten.');
      }
    } catch (err) {
      setError('Netzwerkfehler. Bitte erneut versuchen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-black text-gray-300 flex items-center">
      <div className="container mx-auto px-6 max-w-xl w-full">
        <h1 className="font-serif-display text-4xl text-white text-center mb-8">Kinkly Berlin</h1>

        <div className="flex justify-center mb-8 space-x-4">
          <button
            onClick={() => setMode('code')}
            className={`px-4 py-2 rounded border ${mode==='code' ? 'bg-white text-black' : 'border-gray-600 text-gray-300'}`}
          >
            Elite Passcode
          </button>
          <button
            onClick={() => setMode('waitlist')}
            className={`px-4 py-2 rounded border ${mode==='waitlist' ? 'bg-white text-black' : 'border-gray-600 text-gray-300'}`}
          >
            Kein Passcode?
          </button>
        </div>

        {mode === 'code' ? (
          <form onSubmit={validateCode} className="space-y-4">
            <input
              type="text"
              value={elitePasscode}
              onChange={(e) => setElitePasscode(e.target.value.toUpperCase())}
              placeholder="Elite Passcode"
              className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-3 text-white text-center"
            />
            <button disabled={loading || !elitePasscode}
              className="w-full bg-white text-black py-3 font-semibold rounded disabled:opacity-60">
              {loading ? 'Prüfe…' : 'Eintreten'}
            </button>
          </form>
        ) : (
          <form onSubmit={submitWaitlist} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E‑Mail für Warteliste"
              className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-3 text-white text-center"
            />
            <button disabled={loading || !email}
              className="w-full bg-white text-black py-3 font-semibold rounded disabled:opacity-60">
              {loading ? 'Sende…' : 'Warteliste beitreten'}
            </button>
          </form>
        )}

        {message && <p className="text-green-400 text-center mt-4">{message}</p>}
        {error && <p className="text-red-400 text-center mt-4">{error}</p>}
      </div>
    </section>
  );
};

export default PreloaderLanding;


