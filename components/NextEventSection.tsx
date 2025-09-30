import React from 'react';
import Countdown from './Countdown';
import { useLanguage } from '../contexts/LanguageContext';

interface NextEventSectionProps {
  onTicketClick: () => void;
}

const NextEventSection: React.FC<NextEventSectionProps> = ({ onTicketClick }) => {
  const { t } = useLanguage();
  // Set target date to Dec 6, 2025, 21:00 Berlin time.
  const targetDate = "2025-12-06T21:00:00";

  return (
    <section className="py-20 md:py-32 bg-gray-900/50">
      <div className="container mx-auto px-6 text-center">
        <h2 className="font-serif-display text-4xl md:text-5xl text-white mb-4">{t.next_event_title}</h2>
        <p className="text-gray-400 mb-10">
          {t.next_event_paragraph_1}
          <br />
          {t.next_event_paragraph_2}
        </p>
        
        <div className="flex justify-center items-center gap-8 md:gap-16 mb-10">
          <Countdown targetDate={targetDate} />
          <div className="text-left">
            <div className="text-3xl md:text-5xl font-bold text-white">
              {/* Dynamic Content Placeholder: Remaining spots would be fetched and displayed here. */}
              23
            </div>
            <div className="text-sm text-gray-400 tracking-wider">{t.next_event_spots_left}</div>
          </div>
        </div>
        
        <div className="flex flex-col items-center">
          <button onClick={onTicketClick} className="bg-white text-black py-3 px-10 hover:bg-gray-200 transition-all duration-300 tracking-wider font-semibold transform hover:scale-105">
            {t.next_event_button}
          </button>
          <span className="text-xs text-gray-500 mt-2">{t.next_event_button_note}</span>
        </div>
      </div>
    </section>
  );
};

export default NextEventSection;