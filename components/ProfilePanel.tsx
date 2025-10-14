import React, { useEffect, useState } from 'react';

const API_BASE = 'https://kinkly-backend.onrender.com';

const ProfilePanel: React.FC = () => {
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);
  const [stats, setStats] = useState<{ totalReferred: number; totalWithPurchase: number } | null>(null);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const me = await fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' });
        if (me.ok) {
          const data = await me.json();
          setUser(data.user);
          // Load referrer stats silently
          const r = await fetch(`${API_BASE}/api/user/referrer-stats`, { credentials: 'include' });
          if (r.ok) setStats(await r.json());
        }
      } catch { /* ignore */ }
    };
    load();
  }, []);

  const addPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setStatus('saving');
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/user/add-passcode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: code.trim().toUpperCase() })
      });
      if (res.ok) {
        setStatus('saved');
        setTimeout(() => setStatus('idle'), 1500);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Fehler beim Speichern');
        setStatus('error');
      }
    } catch {
      setError('Netzwerkfehler');
      setStatus('error');
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-6 mb-8">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-gray-400">Eingeloggt als</p>
            <p className="text-white font-medium">{user.email}</p>
          </div>
          <form onSubmit={addPasscode} className="flex items-center gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Elite Passcode hinzufügen"
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
            />
            <button disabled={status==='saving'} className="bg-white text-black px-4 py-2 rounded font-semibold disabled:opacity-60">
              {status==='saving' ? 'Speichere…' : 'Hinzufügen'}
            </button>
          </form>
        </div>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        {status==='saved' && <p className="text-green-400 text-sm mt-2">Gespeichert.</p>}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-gray-800 rounded p-3 text-center">
              <p className="text-xs text-gray-400">Geworben gesamt</p>
              <p className="text-xl text-white font-semibold">{stats.totalReferred}</p>
            </div>
            <div className="bg-gray-800 rounded p-3 text-center">
              <p className="text-xs text-gray-400">Davon mit Kauf</p>
              <p className="text-xl text-white font-semibold">{stats.totalWithPurchase}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePanel;


