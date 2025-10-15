import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface TicketFormProps {
  onSubmitSuccess: (applicationId: string) => void;
  selectedTier: { title: string; price: string } | null;
}

const TicketForm: React.FC<TicketFormProps> = ({ onSubmitSuccess, selectedTier }) => {
  const { t } = useLanguage();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [referralCodeId, setReferralCodeId] = useState<number | null>(null);
  const [elitePasscode, setElitePasscode] = useState<string>('');
  const API_BASE_URL = 'https://kinkly-backend.onrender.com';

  // Load form data and elite passcode on component mount
  useEffect(() => {
    // Load form data from localStorage
    const savedData = localStorage.getItem('kinklyFormData');
    console.log('Loading form data from localStorage:', savedData);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        console.log('Parsed form data:', parsed);
        setFormData({
          firstName: parsed.firstName || '',
          lastName: parsed.lastName || '',
          email: parsed.email || ''
        });
        // Clear the data after loading to prevent re-use
        localStorage.removeItem('kinklyFormData');
      } catch (error) {
        console.error('Error parsing saved form data:', error);
      }
    }
    
    // Load elite passcode from multiple sources (priority order)
    let passcode = '';
    
    // 1. Check URL parameter first
    const codeParam = new URLSearchParams(window.location.search).get('elitePasscode');
    if (codeParam) {
      passcode = codeParam.toUpperCase();
      console.log('Elite passcode from URL:', passcode);
    }
    
    // 2. Check sessionStorage
    if (!passcode) {
      const sessionCode = sessionStorage.getItem('elitePasscode');
      if (sessionCode) {
        passcode = sessionCode.toUpperCase();
        console.log('Elite passcode from sessionStorage:', passcode);
      }
    }
    
    // 3. Check localStorage (fallback)
    if (!passcode) {
      const localCode = localStorage.getItem('elitePasscode');
      if (localCode) {
        passcode = localCode.toUpperCase();
        console.log('Elite passcode from localStorage:', passcode);
      }
    }
    
    if (passcode) {
      setElitePasscode(passcode);
      // Store in sessionStorage for persistence
      sessionStorage.setItem('elitePasscode', passcode);
      console.log('Elite passcode set in state:', passcode);
    } else {
      console.log('No elite passcode found from any source');
      console.log('URL params:', window.location.search);
      console.log('SessionStorage:', sessionStorage.getItem('elitePasscode'));
      console.log('LocalStorage:', localStorage.getItem('elitePasscode'));
    }
    
    // Load referral code ID from sessionStorage
    const savedReferralCodeId = sessionStorage.getItem('referralCodeId');
    if (savedReferralCodeId) {
      setReferralCodeId(parseInt(savedReferralCodeId));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const data = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      message: (e.currentTarget.querySelector('textarea[name="message"]') as HTMLTextAreaElement)?.value || '',
      tier: selectedTier?.title || 'The Invitation', // Default to a valid tier
      referralCodeId: referralCodeId,
      elitePasscode: elitePasscode // Include elite passcode in submission
    };
    
    console.log('Submitting data:', data); // Debug log

    try {
      const response = await fetch(`${API_BASE_URL}/api/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit application.');
      }

      const result = await response.json();
      onSubmitSuccess(result.applicationId);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="font-serif-display text-2xl sm:text-3xl text-white mb-1">
          Eine Einladung anfragen
        </h2>
        {selectedTier && (
          <span className="block text-lg text-gray-400 font-normal">{selectedTier.title}</span>
        )}
      </div>
      
      {/* Elite Passcode Display - kompakter */}
      <div className="p-3 rounded bg-gray-800 border border-gray-600">
        <div className="text-center">
          <div className="text-xs text-gray-400 mb-1">Ihr Elite Passcode</div>
          <div className="text-lg font-mono font-bold text-white tracking-wider">
            {elitePasscode || 'NICHT VERFÜGBAR'}
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name fields in one row on larger screens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="firstName" className="block text-xs font-medium text-gray-400 mb-1">Vorname</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-xs font-medium text-gray-400 mb-1">Nachname</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="request-email" className="block text-xs font-medium text-gray-400 mb-1">{t.ticket_email_label}</label>
          <input
            type="email"
            id="request-email"
            name="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
            className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
          />
        </div>
        
        <div>
          <label htmlFor="message" className="block text-xs font-medium text-gray-400 mb-1">
            Extra Wünsche (Optional)
          </label>
          <textarea
            id="message"
            name="message"
            rows={2}
            placeholder="Was wünschen Sie sich für den Abend?"
            className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 resize-none"
          ></textarea>
        </div>
        
        {error && <p className="text-red-500 text-xs text-center">{error}</p>}
        
        <div>
          <button 
            type="submit" 
            disabled={isSubmitting || !elitePasscode}
            className="w-full bg-white text-black py-2.5 px-4 hover:bg-gray-200 transition-colors duration-300 font-semibold tracking-wider disabled:bg-gray-400 text-sm"
          >
            {isSubmitting ? t.ticket_button_submitting : t.ticket_button}
          </button>
        </div>
        
        {/* Disclaimer - kleiner und weniger prominent */}
        <p className="text-xs text-gray-500 text-center leading-relaxed">
          Bitte beachten Sie: Das Absenden Ihrer Anfrage und Zahlung ist eine Bewerbung. Es garantiert keinen Eintritt. Die endgültige Bestätigung wird nur vom Zirkel erteilt. Nicht erfolgreiche Bewerbungen werden vollständig zurückerstattet.
        </p>
      </form>
    </div>
  );
};

export default TicketForm;