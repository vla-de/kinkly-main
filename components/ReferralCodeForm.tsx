import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface ReferralCodeFormProps {
  onSuccess: () => void;
  onWaitlistClick?: () => void;
}

const ReferralCodeForm: React.FC<ReferralCodeFormProps> = ({ onSuccess, onWaitlistClick }) => {
  const { t } = useLanguage();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const placeholderCode = 'S7'; // Placeholder for testing

  // Load referral code from sessionStorage on component mount
  useEffect(() => {
    const storedCode = sessionStorage.getItem('referralCode');
    if (storedCode) {
      setCode(storedCode);
      // Automatically validate and proceed if code is found
      handleAutoValidation(storedCode);
    }
  }, []);

  const handleAutoValidation = async (codeToValidate: string) => {
    try {
      const response = await fetch('/api/auth/validate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToValidate.trim().toUpperCase() })
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('referralCode', codeToValidate.trim().toUpperCase());
        localStorage.setItem('referrerId', data.referrerId);
        onSuccess();
      } else {
        // If auto-validation fails, clear the stored code
        sessionStorage.removeItem('referralCode');
        setCode('');
      }
    } catch (err) {
      // If auto-validation fails, clear the stored code
      sessionStorage.removeItem('referralCode');
      setCode('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await fetch('/api/auth/validate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase() })
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('referralCode', code.trim().toUpperCase());
        localStorage.setItem('referrerId', data.referrerId);
        onSuccess();
      } else {
        const errorData = await response.json();
        setError(errorData.error || t.referral_error);
      }
    } catch (err) {
      setError('Verbindungsfehler. Bitte versuchen Sie es erneut.');
    }
  };

  return (
    <div>
      <h2 className="font-serif-display text-3xl text-white text-center mb-2">{t.referral_title}</h2>
      <p className="text-center text-gray-400 mb-6 text-sm">{t.referral_paragraph}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="referral-code" className="sr-only">Access Code</label>
          <input
            type="text"
            id="referral-code"
            name="referral-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t.referral_placeholder}
            required
            className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md py-3 px-4 text-white text-center tracking-widest uppercase focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
          />
        </div>
        {error && <p className="text-red-500 text-xs text-center">{error}</p>}
        <div>
          <button type="submit" className="btn-exclusive w-full bg-white text-black py-3 px-4 font-semibold tracking-wider">
            {t.referral_button}
          </button>
        </div>
      </form>
      
      {onWaitlistClick && (
        <div className="mt-4 text-center">
          <button 
            onClick={onWaitlistClick}
            className="text-gray-400 hover:text-white text-sm underline transition-colors"
          >
            Eine Einladung anfragen
          </button>
        </div>
      )}
    </div>
  );
};

export default ReferralCodeForm;