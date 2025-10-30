import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface HeaderProps {
  onLoginClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLoginClick }) => {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'de' : 'en');
  };

  return (
    <>
      <header className="absolute top-0 left-0 p-6 md:p-8 z-50">
        <button 
          onClick={toggleLanguage} 
          className="btn-glow font-sans text-sm font-medium text-gray-500 hover:text-white"
          aria-label="Change language"
        >
          {language === 'en' ? 'DE' : 'EN'}
        </button>
      </header>
      <header className="absolute top-0 right-0 p-6 md:p-8 z-50">
        <button onClick={onLoginClick} className="btn-glow font-logo text-4xl md:text-5xl text-white k-logo-animate" title={t.header_login_tooltip}>
          K
        </button>
      </header>
    </>
  );
};

export default Header;