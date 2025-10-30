import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import ExperienceSection from './components/ExperienceSection';
import MembershipSection from './components/MembershipSection';
import NextEventSection from './components/NextEventSection';
import Footer from './components/Footer';
import Modal from './components/Modal';
import LoginForm from './components/LoginForm';
import TicketForm from './components/TicketForm';
import ReferralCodeForm from './components/ReferralCodeForm';
import PaymentSelection from './components/PaymentSelection';
import SuccessAnimation from './components/SuccessAnimation';
import Impressum from './components/Impressum';
import Datenschutz from './components/Datenschutz';
import AGB from './components/AGB';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';
import WaitlistForm from './components/WaitlistForm';
import CookieConsent from './components/CookieConsent';
import ProfilePanel from './components/ProfilePanel';
import PreloaderLanding from './components/preloader/PreloaderLanding';

const App: React.FC = () => {
  const [activeModal, setActiveModal] = useState<null | 'login' | 'referral' | 'ticket' | 'payment' | 'success' | 'impressum' | 'datenschutz' | 'agb' | 'waitlist'>(null);
  const [selectedTier, setSelectedTier] = useState<{ title: string; price: string } | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [magicLinkError, setMagicLinkError] = useState<string | null>(null);
  const [verificationPending, setVerificationPending] = useState<boolean>(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const handleOpenLogin = () => setActiveModal('login');
  const handleCloseModal = () => setActiveModal(null);

  const handleTierSelect = (tier: { title: string; price: string }) => {
    setSelectedTier(tier);
    setActiveModal('referral');
  };
  
  const handleOpenReferral = () => {
    // Default to the basic invitation if no specific tier is chosen
    setSelectedTier({ title: 'The Invitation', price: '€950' });
    setActiveModal('referral');
  };

  const handleReferralSuccess = () => {
    setActiveModal('ticket');
  };
  
  const handleTicketSubmitSuccess = (newApplicationId: string) => {
    setApplicationId(newApplicationId);
    setActiveModal('payment');
  };

  const handlePaymentSuccess = () => {
    setActiveModal('success');
  };

  const handleOpenImpressum = () => setActiveModal('impressum');
  const handleOpenDatenschutz = () => setActiveModal('datenschutz');
  const handleOpenWaitlist = () => setActiveModal('waitlist');

  // Check for admin access and magic link errors on component mount
  useEffect(() => {
    const checkAdminAccess = () => {
      const path = window.location.pathname;
      if (path === '/admin') {
        setIsAdmin(true);
      }
    };
    checkAdminAccess();

    // Check for magic link error parameters
    const checkMagicLinkError = () => {
      const urlParams = new URLSearchParams(window.location.search);
      // Clear verification pending if verified
      if (urlParams.get('verified') === '1') {
        localStorage.removeItem('kinklyVerificationPending');
        localStorage.removeItem('kinklyFormData');
        setVerificationPending(false);
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('verified');
        window.history.replaceState({}, '', newUrl.toString());
      }
      const error = urlParams.get('error');
      if (error) {
        const errorMessages: { [key: string]: string } = {
          'missing_token': 'Login-Link ist unvollständig. Bitte fordern Sie einen neuen Link an.',
          'invalid_token': 'Login-Link ist ungültig. Bitte fordern Sie einen neuen Link an.',
          'token_used': 'Dieser Login-Link wurde bereits verwendet. Bitte fordern Sie einen neuen Link an.',
          'token_expired': 'Login-Link ist abgelaufen. Bitte fordern Sie einen neuen Link an.',
          'login_failed': 'Login fehlgeschlagen. Bitte versuchen Sie es erneut.'
        };
        setMagicLinkError(errorMessages[error] || 'Ein unbekannter Fehler ist aufgetreten.');
        
        // Clean up URL
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('error');
        window.history.replaceState({}, '', newUrl.toString());
      }
    };
    checkMagicLinkError();

    // Read soft-gate state for verification from localStorage
    try {
      const pending = localStorage.getItem('kinklyVerificationPending') === '1';
      const saved = localStorage.getItem('kinklyFormData');
      const savedEmail = saved ? (JSON.parse(saved).email as string | undefined) : undefined;
      setVerificationPending(!!pending);
      setPendingEmail(savedEmail || null);
    } catch {}

    // Check auth session via cookie on backend domain
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        const ok = res.ok;
        setIsAuthenticated(ok);
        // After login via magic link, focus member dashboard
        const params = new URLSearchParams(window.location.search);
        if (ok && params.get('member') === '1') {
          setTimeout(() => {
            const el = document.getElementById('profile-panel');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 50);
          // Clean URL
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('member');
          window.history.replaceState({}, '', newUrl.toString());
        }
      } catch {
        setIsAuthenticated(false);
      }
    })();

    // Listen for custom events from cookie consent
    const handleOpenModal = (event: CustomEvent) => {
      setActiveModal(event.detail);
    };

    window.addEventListener('openModal', handleOpenModal as EventListener);
    return () => window.removeEventListener('openModal', handleOpenModal as EventListener);
  }, []);

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
  };


  // Show admin interface if admin access is enabled
  if (isAdmin) {
    return isAdminAuthenticated ? <AdminPanel /> : <AdminLogin onLoginSuccess={handleAdminLoginSuccess} />;
  }

  const path = typeof window !== 'undefined' ? window.location.pathname : '/';

  // Simple router: '/' -> Preloader, '/event' -> Event View
  if (path === '/') {
    return (
      <div className="bg-black min-h-screen text-gray-300 font-sans antialiased relative">
        <main>
          <PreloaderLanding />
        </main>
        <Modal isOpen={activeModal === 'login'} onClose={handleCloseModal}>
          <LoginForm />
        </Modal>
        <Modal isOpen={activeModal === 'impressum'} onClose={handleCloseModal}>
          <Impressum />
        </Modal>
        <Modal isOpen={activeModal === 'datenschutz'} onClose={handleCloseModal}>
          <Datenschutz />
        </Modal>
        <Modal isOpen={activeModal === 'agb'} onClose={handleCloseModal}>
          <AGB />
        </Modal>
        <CookieConsent onAccept={() => {}} onDecline={() => {}} />
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen text-gray-300 font-sans antialiased relative">
      {/* Email Verification Soft-Gate Banner (non-sticky, above header) */}
      {verificationPending && (
        <div className="pt-3 px-3 md:px-4">
          <div className="mx-auto max-w-[720px]">
            <div className="bg-zinc-900/40 border border-zinc-600/30 text-zinc-200 px-3 py-2 md:px-4 md:py-2 rounded-md">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 justify-between">
                <span className="text-[11px] md:text-sm leading-snug">
                  {`Bitte bestätige deine E‑Mail-Adresse${pendingEmail ? ' (' + pendingEmail + ')' : ''} – prüfe deinen Posteingang.`}
                </span>
                <div className="flex items-center gap-2 md:gap-3">
                  <button
                    onClick={async () => {
                      if (!pendingEmail || resendState === 'sending') return;
                      setResendState('sending');
                      try {
                        const res = await fetch('/api/auth/request-email-verification', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: pendingEmail, redirectUrl: window.location.origin + '/event' })
                        });
                        setResendState(res.ok ? 'sent' : 'error');
                      } catch {
                        setResendState('error');
                      } finally {
                        setTimeout(() => setResendState('idle'), 4000);
                      }
                    }}
                    className="text-zinc-300 hover:text-white underline disabled:opacity-60 text-[11px] md:text-sm"
                    disabled={!pendingEmail || resendState === 'sending'}
                  >
                    {resendState === 'sending' ? 'Sende…' : resendState === 'sent' ? 'Gesendet' : 'Mail erneut senden'}
                  </button>
                  <button
                    onClick={() => setActiveModal('login')}
                    className="text-zinc-300 hover:text-white underline text-[11px] md:text-sm"
                  >
                    Einloggen
                  </button>
                  <button
                    onClick={() => setVerificationPending(false)}
                    className="text-zinc-300 hover:text-white text-sm"
                    aria-label="Banner schließen"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Header onLoginClick={handleOpenLogin} />
      
      {/* Magic Link Error Banner */}
      {magicLinkError && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-300 px-4 py-3 text-center">
          <div className="container mx-auto flex items-center justify-between">
            <span className="text-sm">{magicLinkError}</span>
            <button 
              onClick={() => setMagicLinkError(null)}
              className="text-red-400 hover:text-red-200 ml-4"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* (Verification banner moved above header) */}
      
      <main>
        <ProfilePanel />
        <HeroSection onTicketClick={handleOpenReferral} />
        <ExperienceSection />
        <MembershipSection onTierSelect={handleTierSelect} />
        <NextEventSection onTicketClick={handleOpenReferral} />
      </main>
      <Footer onImpressumClick={handleOpenImpressum} onDatenschutzClick={handleOpenDatenschutz} onAGBClick={() => setActiveModal('agb')} />

      <Modal isOpen={activeModal === 'login'} onClose={handleCloseModal}>
        <LoginForm />
      </Modal>

      <Modal isOpen={activeModal === 'referral'} onClose={handleCloseModal}>
        <ReferralCodeForm onSuccess={handleReferralSuccess} onWaitlistClick={handleOpenWaitlist} />
      </Modal>

      <Modal isOpen={activeModal === 'ticket'} onClose={handleCloseModal}>
        <TicketForm onSubmitSuccess={handleTicketSubmitSuccess} selectedTier={selectedTier} />
      </Modal>
      
      <Modal isOpen={activeModal === 'payment'} onClose={handleCloseModal}>
        <PaymentSelection 
          onPaymentSuccess={handlePaymentSuccess} 
          selectedTier={selectedTier}
          applicationId={applicationId} 
        />
      </Modal>

      <Modal isOpen={activeModal === 'success'} onClose={handleCloseModal}>
        <SuccessAnimation />
      </Modal>
      
      <Modal isOpen={activeModal === 'impressum'} onClose={handleCloseModal}>
        <Impressum />
      </Modal>

      <Modal isOpen={activeModal === 'datenschutz'} onClose={handleCloseModal}>
        <Datenschutz />
      </Modal>

      <Modal isOpen={activeModal === 'agb'} onClose={handleCloseModal}>
        <AGB />
      </Modal>

      <Modal isOpen={activeModal === 'waitlist'} onClose={handleCloseModal}>
        <WaitlistForm onSuccess={handleCloseModal} />
      </Modal>
      
      <CookieConsent 
        onAccept={() => console.log('Cookies accepted')}
        onDecline={() => console.log('Cookies declined')}
      />
    </div>
  );
};

export default App;