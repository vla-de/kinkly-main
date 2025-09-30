import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const KeyIcon: React.FC = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>
);

const SuccessAnimation: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="text-center p-4">
      <div className="flex justify-center mb-6 animate-fade-in-key">
        <KeyIcon />
      </div>
      <h2 className="font-serif-display text-3xl text-white mb-2">{t.success_title}</h2>
      <p className="text-gray-400">
        {t.success_paragraph}
      </p>
      <style>{`
        @keyframes fade-in-key-anim {
          0% { opacity: 0; transform: translateY(20px) rotate(-10deg); }
          100% { opacity: 1; transform: translateY(0) rotate(0); }
        }
        .animate-fade-in-key {
          animation: fade-in-key-anim 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default SuccessAnimation;