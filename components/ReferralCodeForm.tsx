import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface ReferralCodeFormProps {
  onSuccess: () => void;
}

const ReferralCodeForm: React.FC<ReferralCodeFormProps> = ({ onSuccess }) => {
  const { t } = useLanguage();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const placeholderCode = 'SECRET2024'; // Placeholder for testing

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().toUpperCase() === placeholderCode) {
      setError('');
      onSuccess();
    } else {
      setError(t.referral_error);
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
          <button type="submit" className="w-full bg-white text-black py-3 px-4 hover:bg-gray-200 transition-colors duration-300 font-semibold tracking-wider">
            {t.referral_button}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReferralCodeForm;