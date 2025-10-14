import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface FooterProps {
  onImpressumClick: () => void;
  onDatenschutzClick: () => void;
  onAGBClick: () => void;
}



const Footer: React.FC<FooterProps> = ({ onImpressumClick, onDatenschutzClick, onAGBClick }) => {
  const { t } = useLanguage();
  const [brandText, setBrandText] = useState('KINKLY.EU');
  const [isAnimating, setIsAnimating] = useState(false);
  
  const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const targetText = 'BY VLAD';
  
  const animateText = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    let currentText = 'KINKLY.EU';
    const steps = 20;
    const stepDuration = 200; // 4s total / 20 steps = 200ms per step
    
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
            setBrandText('KINKLY.EU');
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
            className="cursor-pointer transition-all duration-300 hover:text-white"
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