import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LoginForm: React.FC = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setError(null);
    try {
      const res = await fetch('/api/auth/request-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, redirectUrl: window.location.origin + '/event?member=1' })
      });
      if (res.ok) {
        setStatus('sent');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to send login link');
        setStatus('error');
      }
    } catch (err) {
      setError('Network error');
      setStatus('error');
    }
  };

  return (
    <div>
      <h2 className="font-serif-display text-3xl text-white text-center mb-6">{t.login_title}</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-400">{t.login_email_label}</label>
          <input
            type="email"
            id="email"
            name="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
          />
        </div>
        <div>
          <button type="submit" disabled={status==='sending'||status==='sent'} className="w-full bg-white text-black py-3 px-4 hover:bg-gray-200 transition-colors duration-300 font-semibold tracking-wider disabled:opacity-60">
            {status==='sent' ? 'Link gesendet' : t.login_button}
          </button>
        </div>
        {error && <p className="text-center text-sm text-red-400">{error}</p>}
        {status==='sent' && <p className="text-center text-sm text-green-400">Checke deine E-Mail für den Login-Link.</p>}
      </form>
    </div>
  );
};

export default LoginForm;