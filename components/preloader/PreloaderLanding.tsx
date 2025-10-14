import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const API_BASE = 'https://kinkly-backend.onrender.com';

const PreloaderLanding: React.FC = () => {
  const { language } = useLanguage();
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
        setError(data.error || (language === 'en' ? 'Invalid code.' : 'Code ungültig.'));
      } else {
        window.location.href = `/event?elitePasscode=${elitePasscode.trim().toUpperCase()}`;
      }
    } catch (err) {
      setError(language === 'en' ? 'Network error. Please try again.' : 'Netzwerkfehler. Bitte erneut versuchen.');
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
        setMessage(language === 'en' ? 'Welcome to the circle – we will be in touch.' : 'Willkommen im Kreis – wir melden uns.');
        setEmail('');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || (language === 'en' ? 'An error occurred.' : 'Ein Fehler ist aufgetreten.'));
      }
    } catch (err) {
      setError(language === 'en' ? 'Network error. Please try again.' : 'Netzwerkfehler. Bitte erneut versuchen.');
    } finally {
      setLoading(false);
    }
  };

  const sendMagicLink = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/request-magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), redirectUrl: window.location.origin + '/event' })
      });
      if (res.ok) {
        setMessage(language === 'en' ? 'We sent you a secure login link.' : 'Wir haben dir einen sicheren Login‑Link gesendet.');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || (language === 'en' ? 'Failed to send login link.' : 'Login‑Link konnte nicht gesendet werden.'));
      }
    } catch {
      setError(language === 'en' ? 'Network error. Please try again.' : 'Netzwerkfehler. Bitte erneut versuchen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-black text-gray-300 flex items-center relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-40 flex items-start justify-center mt-10">
        {/* Lottie primary, video fallback */}
        <lottie-player
          autoplay
          loop
          mode="normal"
          src="/medusa/medusa-loop2-1_animation.json"
          style={{ width: '420px', height: '420px' }}
        ></lottie-player>
        <video
          className="absolute w-[420px] h-[420px] object-contain"
          autoPlay
          muted
          loop
          playsInline
          poster="/medusa/medusa-frame.png-hold"
        >
          <source src="/medusa/medusa_loop.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="container mx-auto px-6 max-w-xl w-full relative">
        <h1 className="font-serif-display text-4xl text-white text-center mb-8">Kinkly Berlin</h1>

        <div className="flex justify-center mb-8 space-x-4">
          <button
            onClick={() => setMode('code')}
            className={`px-4 py-2 rounded border ${mode==='code' ? 'bg-white text-black' : 'border-gray-600 text-gray-300'}`}
          >
            {language === 'en' ? 'Elite Passcode' : 'Elite Passcode'}
          </button>
          <button
            onClick={() => setMode('waitlist')}
            className={`px-4 py-2 rounded border ${mode==='waitlist' ? 'bg-white text-black' : 'border-gray-600 text-gray-300'}`}
          >
            {language === 'en' ? 'No passcode?' : 'Kein Passcode?'}
          </button>
        </div>

        {mode === 'code' ? (
          <form onSubmit={validateCode} className="space-y-4">
            <input
              type="text"
              value={elitePasscode}
              onChange={(e) => setElitePasscode(e.target.value.toUpperCase())}
              placeholder={language === 'en' ? 'Elite Passcode' : 'Elite Passcode'}
              className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-3 text-white text-center"
            />
            <button disabled={loading || !elitePasscode}
              className="w-full bg-white text-black py-3 font-semibold rounded disabled:opacity-60">
              {loading ? (language === 'en' ? 'Checking…' : 'Prüfe…') : (language === 'en' ? 'Enter' : 'Eintreten')}
            </button>
          </form>
        ) : (
          <form onSubmit={submitWaitlist} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={language === 'en' ? 'Email for waitlist' : 'E‑Mail für Warteliste'}
              className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-3 text-white text-center"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button disabled={loading || !email}
                className="w-full bg-white text-black py-3 font-semibold rounded disabled:opacity-60">
                {loading ? (language === 'en' ? 'Sending…' : 'Sende…') : (language === 'en' ? 'Join waitlist' : 'Warteliste beitreten')}
              </button>
              <button type="button" onClick={sendMagicLink} disabled={loading || !email}
                className="w-full bg-gray-100 text-black py-3 font-semibold rounded disabled:opacity-60">
                {language === 'en' ? 'Send login link' : 'Login‑Link senden'}
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center">
              {language === 'en'
                ? 'By joining or requesting a login link you agree to our privacy policy.'
                : 'Mit Klick stimmst du unserer Datenschutzerklärung zu.'}
            </p>
          </form>
        )}

        {message && <p className="text-green-400 text-center mt-4">{message}</p>}
        {error && <p className="text-red-400 text-center mt-4">{error}</p>}
      </div>
    </section>
  );
};

export default PreloaderLanding;


