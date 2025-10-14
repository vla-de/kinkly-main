import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface WaitlistFormProps {
  onSuccess: () => void;
}

const WaitlistForm: React.FC<WaitlistFormProps> = ({ onSuccess }) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });
      
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ein Fehler ist aufgetreten.');
      }
    } catch (err) {
      setError('Verbindungsfehler. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto bg-green-900 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h3 className="font-serif-display text-2xl text-white mb-2">Willkommen im Kreis</h3>
          <p className="text-gray-400">Sie sind jetzt auf der Warteliste. Die Einladung wird folgen.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-serif-display text-3xl text-white text-center mb-2">
        HINTERLASSEN SIE IHRE KARTE.
      </h2>
      <p className="text-center text-gray-400 mb-6 text-sm">
        Sollte ein Platz frei werden oder eine neue Soiree bevorstehen,<br />
        könnten die Auserwählten eine Einladung erhalten.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="waitlist-email" className="sr-only">E-Mail-Adresse</label>
          <input
            type="email"
            id="waitlist-email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-Mail-Adresse eintragen"
            required
            className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md py-3 px-4 text-white text-center focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
          />
        </div>
        
        {error && <p className="text-red-500 text-xs text-center">{error}</p>}
        
        <div>
          <button 
            type="submit" 
            disabled={loading}
            className="btn-exclusive w-full bg-white text-black py-3 px-4 font-semibold tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Wird hinzugefügt...' : 'ANFRAGEN'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WaitlistForm;