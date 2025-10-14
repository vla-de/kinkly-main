import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface FooterProps {
  onImpressumClick: () => void;
  onDatenschutzClick: () => void;
  onAGBClick: () => void;
}



const Footer: React.FC<FooterProps> = ({ onImpressumClick, onDatenschutzClick, onAGBClick }) => {
  const { t } = useLanguage();
  const [brandText, setBrandText] = useState('2025 KINKLY');
  const [isAnimating, setIsAnimating] = useState(false);
  
  const randomChars = 'ABCDEFG$I%LM*OPQ#TUVWXYZ01!?3456789';
  const targetText = 'VLADISIGN';
  
  const animateText = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    let currentText = '2025 KINKLY';
    const steps = 20;
    const stepDuration = 150; // 4s total / 20 steps = 200ms per step
    
    for (let i = 0; i < steps; i++) {
      setTimeout(() => {
        if (i < steps - 1) {
          // Random characters
          const randomText = currentText.split('').map((char, index) => {
            if (char === '.') return '.';
            return randomChars[Math.floor(Math.random() * randomChars.length)];
          }).join('');
          setBrandText(randomText);
        } else {
          // Final text
          setBrandText(targetText);
          setTimeout(() => {
            setBrandText('2025 KINKLY');
            setIsAnimating(false);
          }, 2000);
        }
      }, i * stepDuration);
    }
  };
  
  return (
    <footer className="bg-black py-8">
      <div className="container mx-auto px-6 flex flex-col sm:flex-row justify-between items-center text-center">
        <div className="text-sm text-gray-600 mb-4 sm:mb-0">
          <span 
            className="cursor-default transition-all duration-300 hover:text-white"
            onMouseEnter={animateText}
          >
            {brandText}
          </span>
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