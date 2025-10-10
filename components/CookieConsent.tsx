import React, { useState, useEffect } from 'react';

interface CookieConsentProps {
  onAccept: () => void;
  onDecline: () => void;
}

const CookieConsent: React.FC<CookieConsentProps> = ({ onAccept, onDecline }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setIsVisible(false);
    onAccept();
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setIsVisible(false);
    onDecline();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 p-4 z-50">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-white text-sm">
            Wir verwenden Cookies, um Ihnen die beste Erfahrung zu bieten. Durch die Nutzung unserer Website stimmen Sie der Verwendung von Cookies zu. 
            <a href="/datenschutz" className="text-gray-300 underline hover:text-white ml-1">
              Mehr erfahren
            </a>
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleDecline}
            className="px-4 py-2 text-gray-300 border border-gray-600 rounded-md hover:bg-gray-800 transition-colors text-sm"
          >
            Ablehnen
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            Akzeptieren
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
