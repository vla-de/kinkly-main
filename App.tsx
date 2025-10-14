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

  // Check for admin access on component mount
  useEffect(() => {
    const checkAdminAccess = () => {
      const path = window.location.pathname;
      if (path === '/admin') {
        setIsAdmin(true);
      }
    };
    checkAdminAccess();

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
        <Header onLoginClick={handleOpenLogin} />
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
      <Header onLoginClick={handleOpenLogin} />
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