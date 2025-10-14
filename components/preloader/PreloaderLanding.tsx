import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import KLogo from './KLogo';
import MedusaLoader from './MedusaLoader';
import ScrollIndicator from './ScrollIndicator';

const API_BASE = 'https://kinkly-backend.onrender.com';

type AnimationPhase = 'initial' | 'docking' | 'loading' | 'formVisible';

const PreloaderLanding: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const [mode, setMode] = useState<'code' | 'waitlist'>('code');
  const [phase, setPhase] = useState<AnimationPhase>('initial');
  const [elitePasscode, setElitePasscode] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);

  const SCROLL_TRIGGER_DISTANCE = 50;

  const handleScroll = useCallback(() => {
    if (window.scrollY > SCROLL_TRIGGER_DISTANCE) {
      setPhase('docking');
      window.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    if (phase === 'initial') {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [phase, handleScroll]);

  useEffect(() => {
    const isLocked = phase === 'docking' || phase === 'loading' || phase === 'formVisible';
    document.body.style.overflow = isLocked ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [phase]);

  const handleKTransitionEnd = useCallback(() => {
    if (phase === 'docking') setPhase('loading');
  }, [phase]);

  useEffect(() => {
    if (phase === 'loading') {
      const t = setTimeout(() => setPhase('formVisible'), 2000);
      return () => clearTimeout(t);
    }
  }, [phase]);

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
    
    // If email exists, send magic link instead
    if (emailExists) {
      await sendMagicLink();
      return;
    }
    
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

  // Check if email exists when user types
  const checkEmailExists = async (emailToCheck: string) => {
    if (!emailToCheck.includes('@')) {
      setEmailExists(null);
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE}/api/auth/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToCheck.trim() })
      });
      setEmailExists(res.ok);
    } catch {
      setEmailExists(null);
    }
  };

  // Debounced email check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (email.trim()) {
        checkEmailExists(email);
      } else {
        setEmailExists(null);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [email]);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'de' : 'en');
  };

  return (
    <main className="bg-black min-h-screen text-gray-300 relative overflow-x-hidden">
      {/* Language Toggle - always visible */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={toggleLanguage}
          className="group inline-flex items-center gap-1 text-[#404040] text-sm bg-white/5 backdrop-blur px-3 py-1.5 rounded-full border border-[#404040]/20 hover:bg-[#404040]/10 transition"
          aria-label="Toggle language"
        >
          <span className="group-hover:hidden">{language.toUpperCase()}</span>
          <span className="hidden group-hover:inline">{(language === 'en' ? 'DE' : 'EN')}</span>
        </button>
      </div>
      
      <div className="h-[200vh] relative">
        <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center">
          <KLogo phase={phase} onTransitionEnd={handleKTransitionEnd} />

          {/* Overlay content area */}
          <div className={`fixed inset-0 z-30 ${phase === 'formVisible' ? 'pointer-events-auto' : 'pointer-events-none'}`}>
            <div className="h-full w-full overflow-y-auto overscroll-contain scrollbar-none">
              <div className="min-h-full flex flex-col items-center justify-center pt-[10vh] pb-8 space-y-8">
                {/* Medusa shows from loading onwards */}
                <div className={`flex items-center justify-center transition-opacity duration-[2000ms] ease-out ${phase === 'loading' || phase === 'formVisible' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  <MedusaLoader />
                </div>

                <div className="w-full max-w-6xl px-4">
                  <div className={`flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-16 items-center lg:items-start transition-all duration-2000 ease-out ${phase === 'formVisible' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'}`}>
                    {/* Left text */}
                    <div className="max-w-xl mx-auto lg:mx-0 text-center lg:text-left text-white/80 space-y-4 text-lg leading-relaxed">
                      {language === 'en' ? (
                        <>
                          <p>Kinkly is no ordinary night. It is a ritual. A secret feast of the senses, inspired by Gatsby, carried by elegance, created for those who demand more. Only every three months. Only for those who hold the key.</p>
                          <p>An evening that ignites the senses, connects souls, and creates unforgettable moments – exclusively for those who live the extraordinary.</p>
                        </>
                      ) : (
                        <>
                          <p>Kinkly ist keine gewöhnliche Nacht. Es ist ein Ritual – ein geheimes Fest der Sinne, getragen von Eleganz, geschaffen für jene, die mehr verlangen. Nur alle drei Monate. Nur für diejenigen, die den Schlüssel besitzen.</p>
                          <p>Ein Abend, der die Sinne entfacht, Seelen verbindet und unvergessliche Momente schafft – exklusiv für Menschen, die das Außergewöhnliche leben.</p>
                        </>
                      )}
                    </div>

                    {/* Right column: elegant form */}
                    <div className="w-full max-w-md mx-auto lg:mx-0">
                      {mode === 'code' ? (
                        <div>
                          <h2 className="font-serif-display text-3xl md:text-4xl text-white mb-4">{language==='en' ? 'THE INVITATION AWAITS.' : ''}</h2>
                          <form onSubmit={validateCode} className="space-y-3">
                            <input type="text" value={elitePasscode} onChange={(e) => setElitePasscode(e.target.value.toUpperCase())} placeholder={language === 'en' ? 'Enter your Elite Passcode' : 'Elite Passcode eingeben'} className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-3 text-white text-center" />
                            <button disabled={loading || !elitePasscode} className="w-full bg-white text-black py-3 font-semibold rounded disabled:opacity-60">{loading ? (language === 'en' ? 'Checking…' : 'Prüfe…') : (language === 'en' ? 'ENTER' : 'EINTRETEN')}</button>
                          </form>
                          <div className="mt-3 text-center">
                            <button type="button" onClick={() => setMode('waitlist')} className="text-gray-400 hover:text-gray-200 underline text-sm">
                              {language==='en' ? 'No passcode? Join the waitlist' : 'Kein Passcode? Warteliste beitreten'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h2 className="font-serif-display text-3xl md:text-4xl text-white mb-4">{language==='en' ? 'JOIN THE CIRCLE.' : ''}</h2>
                          <form onSubmit={submitWaitlist} className="space-y-4">
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={language === 'en' ? 'Email for waitlist' : 'E‑Mail für Warteliste'} className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-3 text-white text-center" />
                            <button disabled={loading || !email} className="w-full bg-white text-black py-3 font-semibold rounded disabled:opacity-60">
                              {loading ? (language === 'en' ? 'Sending…' : 'Sende…') : 
                               (emailExists === true ? 
                                (language === 'en' ? 'Send Magic Link' : 'Magic Link senden') : 
                                (language === 'en' ? 'Join waitlist' : 'Warteliste beitreten'))}
                            </button>
                          </form>
                          <div className="mt-3 text-center">
                            <button type="button" onClick={() => setMode('code')} className="text-gray-400 hover:text-gray-200 underline text-sm">
                              {language==='en' ? 'Have a passcode? Enter it here' : 'Passcode vorhanden? Hier eingeben'}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 text-center mt-4">{language === 'en' ? 'By joining you agree to our privacy policy.' : 'Mit Klick stimmst du unserer Datenschutzerklärung zu.'}</p>
                        </div>
                      )}

                      {message && <p className="text-green-400 text-center mt-4">{message}</p>}
                      {error && <p className="text-red-400 text-center mt-4">{error}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll indicator only before scroll */}
          {phase === 'initial' && <ScrollIndicator />}
        </div>
      </div>
    </main>
  );
};

export default PreloaderLanding;


