import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import KLogo from './KLogo';
import MedusaLoader from './MedusaLoader';
import ScrollIndicator from './ScrollIndicator';
import Footer from '../Footer';
import { unlockAudioOnce } from '../../utils/audio';

// Use same-origin API to avoid cross-site cookie/CORS issues; Vercel rewrites /api/* to backend
const API_BASE = '';

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
  const [showFooter, setShowFooter] = useState(false);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [validatedCode, setValidatedCode] = useState<string>('');
  const [captureData, setCaptureData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [captureConsent, setCaptureConsent] = useState<boolean>(false);
  const [waitlistFirstName, setWaitlistFirstName] = useState('');
  const [waitlistLastName, setWaitlistLastName] = useState('');
  const [waitlistConsent, setWaitlistConsent] = useState<boolean>(false);
  const [waitlistSubmitted, setWaitlistSubmitted] = useState<boolean>(false);
  const [showVerifiedBanner, setShowVerifiedBanner] = useState<boolean>(false);

  const SCROLL_TRIGGER_DISTANCE = 50;

  // Load elite passcode from URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get('elitePasscode');
    const verified = urlParams.get('verified');
    if (codeFromUrl) {
      setElitePasscode(codeFromUrl.toUpperCase());
      // Auto-validate the code from URL
      setTimeout(() => {
        validateCodeFromUrl(codeFromUrl.toUpperCase());
      }, 1000);
    }
    if (verified === '1') {
      setShowVerifiedBanner(true);
      // Clean up URL
      const newUrl = window.location.pathname + window.location.search.replace(/([?&])verified=1(&|$)/, (m, p1, p2) => p1 === '?' && !p2 ? '' : p1 === '?' ? '?' : p2 ? p1 : '');
      window.history.replaceState({}, '', newUrl || window.location.pathname);
      // Auto hide
      setTimeout(() => setShowVerifiedBanner(false), 5000);
    }
  }, []);

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

  // Unlock WebAudio on first user gesture
  useEffect(() => {
    const unlock = () => unlockAudioOnce();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
    window.addEventListener('click', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock as any);
      window.removeEventListener('touchstart', unlock as any);
      window.removeEventListener('click', unlock as any);
    };
  }, []);

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
    await validateCodeFromUrl(elitePasscode.trim().toUpperCase());
  };

  const validateCodeFromUrl = async (code: string) => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/validate-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || (language === 'en' ? 'Invalid code.' : 'Code ungültig.'));
      } else {
        // Store the validated code in sessionStorage for persistence
        sessionStorage.setItem('elitePasscode', code);
        localStorage.setItem('elitePasscode', code);
        
        // Show email/name capture modal before redirect
        setShowEmailCapture(true);
        setValidatedCode(code);
      }
    } catch (err) {
      setError(language === 'en' ? 'Network error. Please try again.' : 'Netzwerkfehler. Bitte erneut versuchen.');
    } finally {
      setLoading(false);
    }
  };

  const submitWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !waitlistFirstName.trim() || !waitlistLastName.trim() || !waitlistConsent) {
      setError(language === 'en' ? 'Please complete all required fields.' : 'Bitte alle Pflichtfelder ausfüllen.');
      return;
    }
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
        body: JSON.stringify({
          email: email.trim(),
          firstName: waitlistFirstName.trim(),
          lastName: waitlistLastName.trim(),
          consent: true
        })
      });
      if (res.ok) {
        setMessage(language === 'en' ? 'Welcome to the waitlist – we will be in touch.' : 'Willkommen im Wartekreis – wir melden uns.');
        setEmail('');
        setWaitlistFirstName('');
        setWaitlistLastName('');
        setWaitlistConsent(false);
        setWaitlistSubmitted(true);
        setShowFooter(true);
        // ensure footer/links become visible
        setTimeout(() => {
          try {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          } catch {}
        }, 200);
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
        body: JSON.stringify({ email: email.trim(), redirectUrl: window.location.origin + '/event?member=1' })
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

  const handleDatenschutzClick = () => {
    setShowFooter(true);
  };

  const handleImpressumClick = () => {
    setShowFooter(true);
  };

  const handleAGBClick = () => {
    setShowFooter(true);
  };

  const handleEmailCaptureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captureData.email.trim() || !captureData.firstName.trim() || !captureData.lastName.trim() || !captureConsent) {
      setError(language === 'en' ? 'Please complete all required fields.' : 'Bitte alle Pflichtfelder ausfüllen.');
      return;
    }
    
    setLoading(true);
    try {
      // Create or upsert waitlist entry with referral code
      const res = await fetch(`${API_BASE}/api/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: captureData.firstName,
          lastName: captureData.lastName,
          email: captureData.email,
          referralCode: validatedCode,
          formRenderedAt: Date.now()
        })
      });
      
      if (res.ok) {
        // Store data for transfer to event page
        localStorage.setItem('kinklyFormData', JSON.stringify({
          firstName: captureData.firstName,
          lastName: captureData.lastName,
          email: captureData.email
        }));
        // Mark that verification is pending (soft gate on event)
        localStorage.setItem('kinklyVerificationPending', '1');

        // Trigger verification email
        try {
          await fetch('/api/auth/request-email-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: captureData.email, redirectUrl: window.location.origin + '/event' })
          });
        } catch {}
        
        // Redirect to event page
        window.location.href = `/event?elitePasscode=${validatedCode}`;
      } else {
        let serverMsg = '';
        try {
          const data = await res.json();
          serverMsg = data.error || '';
        } catch {
          try {
            serverMsg = await res.text();
          } catch {}
        }
        setError(
          (serverMsg && `${language === 'en' ? 'Server:' : 'Server:'} ${serverMsg}`) ||
          (language === 'en' ? 'Failed to save data.' : 'Daten konnten nicht gespeichert werden.')
        );
      }
    } catch (err) {
      setError(language === 'en' ? 'Network error. Please try again.' : 'Netzwerkfehler. Bitte erneut versuchen.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <main className="bg-black min-h-screen text-gray-300 relative overflow-x-hidden">
      {showVerifiedBanner && (
        <div className="fixed left-0 right-0 top-0 z-40 mt-14 pointer-events-none">
          <div className="mx-auto max-w-[640px] px-3">
            <div className="pointer-events-auto bg-emerald-900/20 backdrop-blur border border-emerald-500/30 text-emerald-200 px-3 py-2 md:px-4 md:py-2 text-[11px] md:text-sm rounded-md shadow-[0_0_30px_rgba(50,220,150,0.06)] flex items-center justify-between gap-2">
              <span>{language==='en' ? 'Email verified. Welcome to the waitlist.' : 'E‑Mail bestätigt. Willkommen im Wartekreis.'}</span>
              <button onClick={() => setShowVerifiedBanner(false)} className="text-emerald-300 hover:text-emerald-100">✕</button>
            </div>
          </div>
        </div>
      )}
      {/* Language Toggle - always visible */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={toggleLanguage}
          className="group inline-flex items-center gap-1 text-[#404040] text-sm sm:text-base bg-white/5 backdrop-blur px-3 py-2 sm:px-4 sm:py-2 rounded-full border border-[#404040]/20 hover:bg-[#404040]/10 transition-all"
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
                  <div className={`min-h-full flex flex-col items-center justify-center pb-8 space-y-8 transition-all duration-500 ease-in-out ${showFooter ? 'pt-[5vh] pb-32' : 'pt-[10vh]'}`}>
                {/* Medusa shows from loading onwards */}
                <div className={`flex items-center justify-center transition-opacity duration-[2000ms] ease-out ${waitlistSubmitted ? 'opacity-0 pointer-events-none' : (phase === 'loading' || phase === 'formVisible' ? 'opacity-100' : 'opacity-0 pointer-events-none')}`}>
                  <MedusaLoader />
                </div>

                <div className="w-full max-w-6xl px-4 sm:px-6 lg:px-8">
                  <div className={`flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-16 items-center lg:items-start transition-all duration-2000 ease-out ${phase === 'formVisible' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'}`}>
                    {/* Left text */}
                    <div className="max-w-xl mx-auto lg:mx-0 text-center lg:text-left text-white/80 space-y-4 text-base sm:text-lg leading-relaxed px-4 sm:px-0">
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
                    <div className="w-full max-w-md mx-auto lg:mx-0 px-4 sm:px-0">
                      {mode === 'code' ? (
                        <div>
                          <h2 className="font-serif-display text-2xl sm:text-3xl md:text-4xl text-white mb-6 text-center lg:text-left">{language==='en' ? 'THE INVITATION AWAITS.' : ''}</h2>
                          <form onSubmit={validateCode} className="space-y-4">
                            <input type="text" value={elitePasscode} onChange={(e) => setElitePasscode(e.target.value.toUpperCase())} placeholder={language === 'en' ? 'Enter your Elite Passcode' : 'Elite Passcode eingeben'} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-4 text-white text-center text-lg focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all" />
                            <button disabled={loading || !elitePasscode} className="w-full bg-white text-black py-4 font-semibold rounded-lg disabled:opacity-60 hover:bg-gray-100 transition-all text-lg">{loading ? (language === 'en' ? 'Checking…' : 'Prüfe…') : (language === 'en' ? 'ENTER' : 'EINTRETEN')}</button>
                          </form>
                          <div className="mt-3 text-center">
                            <button type="button" onClick={() => setMode('waitlist')} className="text-gray-400 hover:text-gray-200 underline text-sm">
                              {language==='en' ? 'No passcode? Join the waitlist' : 'Kein Passcode? Warteliste beitreten'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className={`${waitlistSubmitted ? 'opacity-0 pointer-events-none transition-opacity duration-500' : 'opacity-100 transition-opacity duration-500'}`}>
                          <h2 className="font-serif-display text-2xl sm:text-3xl md:text-4xl text-white mb-6 text-center lg:text-left">{language==='en' ? 'JOIN THE CIRCLE.' : ''}</h2>
                          <form onSubmit={submitWaitlist} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <input type="text" value={waitlistFirstName} onChange={(e) => setWaitlistFirstName(e.target.value)} placeholder={language === 'en' ? 'First Name' : 'Vorname'} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-4 text-white text-center text-lg focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all" />
                              <input type="text" value={waitlistLastName} onChange={(e) => setWaitlistLastName(e.target.value)} placeholder={language === 'en' ? 'Last Name' : 'Nachname'} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-4 text-white text-center text-lg focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all" />
                            </div>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={language === 'en' ? 'Email for waitlist' : 'E‑Mail für Warteliste'} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-4 text-white text-center text-lg focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all" />
                            <label className="flex items-start gap-2 text-xs text-gray-400 leading-snug">
                              <input type="checkbox" checked={waitlistConsent} onChange={(e) => setWaitlistConsent(e.target.checked)} className="mt-1" />
                              <span>
                                {language === 'en'
                                  ? 'By clicking, you agree to our '
                                  : 'Mit Klick stimmst du unserer '}
                                <button type="button" onClick={handleDatenschutzClick} className="underline hover:text-gray-300">{language === 'en' ? 'privacy policy' : 'Datenschutzerklärung'}</button>
                                {language === 'en' ? '.' : ' zu.'}
                              </span>
                            </label>
                            <button disabled={loading || !email} className="w-full bg-white text-black py-4 font-semibold rounded-lg disabled:opacity-60 hover:bg-gray-100 transition-all text-lg">
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
                          {/* duplicate privacy line removed per request */}
                        </div>
                      )}

                      {message && (
                        <div className="transition-all duration-500 mt-4">
                          <p className="text-green-400 text-center">{message}</p>
                          {/* keep passcode link available after success */}
                          {waitlistSubmitted && (
                            <div className="mt-3 text-center">
                              <button type="button" onClick={() => setMode('code')} className="text-gray-300 hover:text-gray-100 underline text-sm">
                                {language==='en' ? 'Have a passcode? Enter it here' : 'Passcode vorhanden? Hier eingeben'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      {error && <p className="text-red-400 text-center mt-4">{error}</p>}
                    </div>
                  </div>
                  
                  {/* Footer appears when privacy policy is clicked */}
                  {showFooter && (
                    <div className="w-full mt-16 transition-all duration-500 ease-in-out">
                      <Footer 
                        onImpressumClick={handleImpressumClick}
                        onDatenschutzClick={handleDatenschutzClick}
                        onAGBClick={handleAGBClick}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

              {/* Scroll indicator only before scroll */}
              {phase === 'initial' && <ScrollIndicator />}
            </div>
          </div>
          
          {/* Email Capture Modal (no Skip; all fields + consent required) */}
          {showEmailCapture && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg sm:text-xl font-serif-display text-white mb-3 sm:mb-4 text-center">
                  {language === 'en' ? 'Almost there...' : 'Fast geschafft...'}
                </h3>
                <p className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6 text-center">
                  {language === 'en' 
                    ? 'Share your details to receive updates about the event.' 
                    : 'Teile deine Daten mit uns, um Updates zum Event zu erhalten.'}
                </p>
                
                <form onSubmit={handleEmailCaptureSubmit} className="space-y-3 sm:space-y-4">
                  {/* Name fields in one row on larger screens */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder={language === 'en' ? 'First Name' : 'Vorname'}
                      value={captureData.firstName}
                      onChange={(e) => setCaptureData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
                    />
                    <input
                      type="text"
                      placeholder={language === 'en' ? 'Last Name' : 'Nachname'}
                      value={captureData.lastName}
                      onChange={(e) => setCaptureData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
                    />
                  </div>
                  
                  <input
                    type="email"
                    placeholder={language === 'en' ? 'Email' : 'E-Mail'}
                    value={captureData.email}
                    onChange={(e) => setCaptureData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
                  />
                  <label className="flex items-start gap-2 text-xs text-gray-400 leading-snug">
                    <input type="checkbox" checked={captureConsent} onChange={(e) => setCaptureConsent(e.target.checked)} className="mt-0.5" />
                    <span>
                      {language === 'en' ? 'I agree to data processing and accept the ' : 'Ich willige in die Datenverarbeitung ein und akzeptiere die '}
                      <button type="button" onClick={handleDatenschutzClick} className="underline hover:text-gray-300">{language === 'en' ? 'privacy policy' : 'Datenschutzerklärung'}</button>
                      .
                    </span>
                  </label>
                  
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button
                      type="submit"
                      disabled={loading || !captureData.email}
                      className="flex-1 bg-white text-black py-2.5 rounded-lg disabled:opacity-60 hover:bg-gray-100 transition-all font-semibold text-sm"
                    >
                      {loading ? (language === 'en' ? 'Saving...' : 'Speichere...') : (language === 'en' ? 'Continue' : 'Weiter')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      );
    };

export default PreloaderLanding;


