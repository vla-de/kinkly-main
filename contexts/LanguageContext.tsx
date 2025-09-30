import React, { createContext, useContext, useState, ReactNode } from 'react';
import { translations } from '../lib/translations';

type Language = 'en' | 'de';
// Infer the structure of the translations from the English version
type TranslationKeys = typeof translations.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const getInitialLanguage = (): Language => {
  if (typeof window !== 'undefined' && window.navigator) {
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('de')) {
      return 'de';
    }
  }
  return 'en';
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  const t = translations[language];

  const value = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};