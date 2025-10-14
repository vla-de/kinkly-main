import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import KLogo from './KLogo';
import MedusaLoader from './MedusaLoader';
import ScrollIndicator from './ScrollIndicator';

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
        <MedusaLoader />
      </div>
      <div className="container mx-auto px-6 max-w-xl w-full relative">
        <div className="flex flex-col items-center mb-6">
          <KLogo />
          <ScrollIndicator />
        </div>

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
          <div className="mt-6">
            {/* 3-column section like original preloader */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              {/* left copy */}
              <div className="text-gray-300 text-sm leading-relaxed order-2 md:order-1">
                {language === 'en' ? (
                  <>
                    <p>Kinkly is no ordinary night. It is a ritual. A secret feast of the senses, inspired by Gatsby, carried by elegance, created for those who demand more. Only every three months. Only for those who hold the key.</p>
                    <p className="mt-4">An evening that ignites the senses, connects souls, and creates unforgettable moments – exclusively for those who live the extraordinary.</p>
                  </>
                ) : (
                  <>
                    <p>Kinkly ist keine gewöhnliche Nacht. Es ist ein Ritual – ein geheimes Fest der Sinne, getragen von Eleganz, geschaffen für jene, die mehr verlangen. Nur alle drei Monate. Nur für diejenigen, die den Schlüssel besitzen.</p>
                    <p className="mt-4">Ein Abend, der die Sinne entfacht, Seelen verbindet und unvergessliche Momente schafft – exklusiv für Menschen, die das Außergewöhnliche leben.</p>
                  </>
                )}
              </div>
              {/* center medusa */}
              <div className="flex justify-center order-1 md:order-2">
                <MedusaLoader />
              </div>
              {/* right form */}
              <div className="order-3">
                <h2 className="font-serif-display text-3xl md:text-4xl text-white mb-4">{language==='en' ? 'THE KEY, PLEASE.' : 'DER SCHLÜSSEL, BITTE.'}</h2>
                <form onSubmit={validateCode} className="space-y-3">
                  <input
                    type="text"
                    value={elitePasscode}
                    onChange={(e) => setElitePasscode(e.target.value.toUpperCase())}
                    placeholder={language === 'en' ? 'Enter your Elite Passcode' : 'Elite Passcode eingeben'}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-3 text-white"
                  />
                  <button disabled={loading || !elitePasscode}
                    className="w-full bg-white text-black py-3 font-semibold rounded disabled:opacity-60">
                    {loading ? (language === 'en' ? 'Checking…' : 'Prüfe…') : (language === 'en' ? 'ENTER' : 'EINTRETEN')}
                  </button>
                </form>
                <div className="mt-3 text-center">
                  <button type="button" onClick={() => setMode('waitlist')} className="text-gray-400 hover:text-gray-200 underline text-sm">
                    {language==='en' ? 'No passcode? Join the waitlist' : 'Kein Passcode? Warteliste beitreten'}
                  </button>
                </div>
              </div>
            </div>
          </div>
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


