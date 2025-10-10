import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface FooterProps {
  onImpressumClick: () => void;
  onDatenschutzClick: () => void;
  onAGBClick: () => void;
}

const InstagramIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);


const Footer: React.FC<FooterProps> = ({ onImpressumClick, onDatenschutzClick, onAGBClick }) => {
  const { t } = useLanguage();
  return (
    <footer className="bg-black py-8">
      <div className="container mx-auto px-6 flex flex-col sm:flex-row justify-between items-center text-center">
        <div className="text-sm text-gray-600 mb-4 sm:mb-0">
          KINKLY.EU
        </div>
        <div className="flex items-center gap-6 mb-4 sm:mb-0">
          <a href="#" className="text-gray-500 hover:text-white transition-colors duration-300" aria-label="Instagram">
            <InstagramIcon />
          </a>
        </div>
        <div className="text-xs text-gray-700">
          <button onClick={onImpressumClick} className="hover:text-gray-400 underline">{t.footer_impressum}</button>
          <span className="mx-2">|</span>
          <button onClick={onDatenschutzClick} className="hover:text-gray-400 underline">{t.footer_datenschutz}</button>
          <span className="mx-2">|</span>
          <button onClick={onAGBClick} className="hover:text-gray-400 underline">AGB</button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;