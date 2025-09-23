import React from 'react';
import RotatingText from './RotatingText';

interface HeroSectionProps {
  onTicketClick: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onTicketClick }) => {
  const headlines = [
    "Where Desire meets Decadence.",
    "The night belongs to the chosen.",
    "Berlin’s most private invitation."
  ];

  return (
    <section className="min-h-screen flex flex-col justify-center items-center text-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="z-10 w-full max-w-4xl mx-auto">
        <div className="mb-4 md:mb-6">
          <p className="text-sm md:text-base text-gray-400 tracking-widest font-serif-display">Nur für die Auserwählten – Entdecken Sie, ob Sie dazugehören</p>
        </div>
        <h1 className="font-serif-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-white mb-6 md:mb-8 h-24 md:h-32 flex items-center justify-center">
          <RotatingText texts={headlines} />
        </h1>
        <p className="max-w-2xl mx-auto text-base md:text-lg text-gray-300 leading-relaxed mb-8 md:mb-12">
          Kinkly is no ordinary night. It is a ritual. A secret feast of the senses, inspired by Gatsby, carried by elegance, created for those who demand more. Only every three months. Only for those who hold the key.
          <span className="block mt-4">Ein Abend, der Sinne entfacht, Seelen verbindet und unvergessliche Momente schafft – exklusiv für jene, die das Außergewöhnliche leben.</span>
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 md:gap-6">
          <div className="flex flex-col items-center">
            <button onClick={onTicketClick} className="w-full sm:w-auto bg-transparent border border-gray-400 text-white py-3 px-8 hover:bg-white hover:text-black transition-all duration-300 tracking-wider transform hover:scale-105">
              Tickets secure
            </button>
            <span className="text-xs text-gray-500 mt-2">Begrenzte Plätze verfügbar</span>
          </div>
          <div className="flex flex-col items-center">
            <a href="#membership" onClick={(e) => { e.preventDefault(); document.querySelector('#membership')?.scrollIntoView({ behavior: 'smooth' }); }} className="w-full sm:w-auto bg-gray-200 text-black py-3 px-8 hover:bg-gray-300 transition-all duration-300 tracking-wider transform hover:scale-105 inline-block">
              Member become
            </a>
            <span className="text-xs text-gray-500 mt-2">Werden Sie Teil des inneren Kreises – bevor es zu spät ist</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
