import React from 'react';
import Countdown from './Countdown';

interface NextEventSectionProps {
  onTicketClick: () => void;
}

const NextEventSection: React.FC<NextEventSectionProps> = ({ onTicketClick }) => {
  // Set target date to Dec 6, 2025, 21:00 Berlin time.
  const targetDate = "2025-12-06T21:00:00";

  return (
    <section className="py-20 md:py-32 bg-gray-900/50">
      <div className="container mx-auto px-6 text-center">
        <h2 className="font-serif-display text-4xl md:text-5xl text-white mb-4">Next Event</h2>
        <p className="text-gray-400 mb-10">
          December 6th, 21:00 - December 7th, 21:00, 2025. A 24-hour immersion.
          <br />
          Location details will be revealed upon invitation.
        </p>
        
        <div className="flex justify-center items-center gap-8 md:gap-16 mb-10">
          <Countdown targetDate={targetDate} />
          <div className="text-left">
            <div className="text-3xl md:text-5xl font-bold text-white">
              {/* Dynamic Content Placeholder: Remaining spots would be fetched and displayed here. */}
              23
            </div>
            <div className="text-sm text-gray-400 tracking-wider">Plätze übrig</div>
          </div>
        </div>
        
        <div className="flex flex-col items-center">
          <button onClick={onTicketClick} className="bg-white text-black py-3 px-10 hover:bg-gray-200 transition-all duration-300 tracking-wider font-semibold transform hover:scale-105">
            Secure now
          </button>
          <span className="text-xs text-gray-500 mt-2">Verpassen Sie nicht diese seltene Gelegenheit.</span>
        </div>
      </div>
    </section>
  );
};

export default NextEventSection;