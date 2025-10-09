import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface TicketFormProps {
  onSubmitSuccess: (applicationId: string) => void;
  selectedTier: { title: string; price: string } | null;
}

const TicketForm: React.FC<TicketFormProps> = ({ onSubmitSuccess, selectedTier }) => {
  const { t } = useLanguage();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const API_BASE_URL = 'https://kinkly-backend.onrender.com';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      message: formData.get('message') as string,
      tier: selectedTier?.title || 'The Invitation', // Default to a valid tier
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
    <div>
      <h2 className="font-serif-display text-3xl text-white text-center mb-2">
        {t.ticket_title}
        {selectedTier && <span className="block text-xl text-gray-400 mt-1 font-normal">{selectedTier.title}</span>}
      </h2>
      <p className="text-center text-gray-400 mb-6 text-sm">
        {t.ticket_paragraph}
      </p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-400">Vorname</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            required
            className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-400">Nachname</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            required
            className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
          />
        </div>
        <div>
          <label htmlFor="request-email" className="block text-sm font-medium text-gray-400">{t.ticket_email_label}</label>
          <input
            type="email"
            id="request-email"
            name="email"
            required
            className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
          />
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-400">
            {t.ticket_message_label}
          </label>
          <textarea
            id="message"
            name="message"
            rows={3}
            className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
          ></textarea>
        </div>
         {error && <p className="text-red-500 text-xs text-center">{error}</p>}
        <div>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-white text-black py-3 px-4 hover:bg-gray-200 transition-colors duration-300 font-semibold tracking-wider disabled:bg-gray-400"
          >
            {isSubmitting ? t.ticket_button_submitting : t.ticket_button}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TicketForm;