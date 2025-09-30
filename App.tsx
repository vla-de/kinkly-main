import React, { useState } from 'react';
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

const App: React.FC = () => {
  const [activeModal, setActiveModal] = useState<null | 'login' | 'referral' | 'ticket' | 'payment' | 'success'>(null);
  const [selectedTier, setSelectedTier] = useState<{ title: string; price: string } | null>(null);

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
  
  const handleTicketSubmitSuccess = () => {
    setActiveModal('payment');
  };

  const handlePaymentSuccess = () => {
    setActiveModal('success');
  };


  return (
    <div className="bg-black min-h-screen text-gray-300 font-sans antialiased relative">
      <Header onLoginClick={handleOpenLogin} />
      <main>
        <HeroSection onTicketClick={handleOpenReferral} />
        <ExperienceSection />
        <MembershipSection onTierSelect={handleTierSelect} />
        <NextEventSection onTicketClick={handleOpenReferral} />
      </main>
      <Footer />

      <Modal isOpen={activeModal === 'login'} onClose={handleCloseModal}>
        <LoginForm />
      </Modal>

      <Modal isOpen={activeModal === 'referral'} onClose={handleCloseModal}>
        <ReferralCodeForm onSuccess={handleReferralSuccess} />
      </Modal>

      <Modal isOpen={activeModal === 'ticket'} onClose={handleCloseModal}>
        <TicketForm onSubmitSuccess={handleTicketSubmitSuccess} selectedTier={selectedTier} />
      </Modal>
      
      <Modal isOpen={activeModal === 'payment'} onClose={handleCloseModal}>
        <PaymentSelection onPaymentSuccess={handlePaymentSuccess} selectedTier={selectedTier} />
      </Modal>

      <Modal isOpen={activeModal === 'success'} onClose={handleCloseModal}>
        <SuccessAnimation />
      </Modal>
    </div>
  );
};

export default App;