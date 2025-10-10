import React, { useState, useEffect } from 'react';

interface PricingTierProps {
  title: string;
  price: string;
  description: string;
  features: string[];
  isFeatured?: boolean;
  onSelect: () => void;
  ctaText: string;
  remainingTickets?: number;
}

const PricingTier: React.FC<PricingTierProps> = ({ title, price, description, features, isFeatured = false, onSelect, ctaText, remainingTickets }) => {
  const [isLowStock, setIsLowStock] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);

  useEffect(() => {
    if (remainingTickets !== undefined && remainingTickets <= 3) {
      setIsLowStock(true);
      // Trigger explosion animation after a delay
      const timer = setTimeout(() => {
        setShowExplosion(true);
        setTimeout(() => setShowExplosion(false), 1000);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setIsLowStock(false);
    }
  }, [remainingTickets]);
  const tierClasses = `border p-8 rounded-lg flex flex-col text-center transition-all duration-300 h-full ${
    isFeatured 
      ? 'bg-gray-900 border-gray-600 transform lg:scale-105 shadow-2xl z-10' 
      : 'bg-black border-gray-800'
  }`;

  const buttonClasses = `btn-exclusive mt-auto w-full py-3 px-8 tracking-wider font-semibold rounded-md ${
    isFeatured
      ? 'bg-white text-black hover:bg-gray-200'
      : 'bg-transparent border border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500'
  }`;

  return (
    <div className={`${tierClasses} ${isLowStock ? 'ring-2 ring-red-500 ring-opacity-50' : ''} ${showExplosion ? 'animate-bounce' : ''}`}>
      <h3 className="font-serif-display text-2xl text-white mb-2">{title}</h3>
      <p className="text-4xl font-bold font-serif-display text-white mb-4">{price}</p>
      {remainingTickets !== undefined && (
        <div className="mb-4">
          <p className="text-sm text-gray-400">
            {remainingTickets > 0 ? (
              <span 
                className={`transition-all duration-500 ${
                  remainingTickets <= 3 ? 'text-red-400 text-lg font-bold animate-pulse' : 
                  remainingTickets <= 6 ? 'text-orange-400 text-base font-semibold' : 
                  'text-yellow-400'
                }`}
              >
                {remainingTickets <= 3 ? '⚠️ Nur noch ' : 'Nur noch '}
                <span className={`inline-block transition-all duration-300 hover:scale-110 ${isLowStock ? 'text-2xl font-black animate-pulse' : ''}`}>
                  {remainingTickets}
                </span>
                {remainingTickets <= 3 ? ' Plätze!' : ' Plätze verfügbar'}
              </span>
            ) : (
              <span className="text-red-400 font-bold">🚫 Ausverkauft</span>
            )}
          </p>
        </div>
      )}
      <p className="text-sm text-gray-500 mb-6 min-h-[40px]">{description}</p>
      <ul className="space-y-3 text-gray-400 mb-8 flex-grow text-left">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <svg className="w-4 h-4 mr-3 mt-1 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <button onClick={onSelect} className={buttonClasses}>
        {ctaText}
      </button>
    </div>
  );
};

export default PricingTier;