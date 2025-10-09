import React, { useState, useEffect } from 'react';
import Countdown from './Countdown';
import { useLanguage } from '../contexts/LanguageContext';

interface NextEventSectionProps {
  onTicketClick: () => void;
}

const NextEventSection: React.FC<NextEventSectionProps> = ({ onTicketClick }) => {
  const { t } = useLanguage();
  const [remainingTickets, setRemainingTickets] = useState(23);
  const [showLiveFeed, setShowLiveFeed] = useState(false);
  
  // Set target date to Dec 6, 2025, 21:00 Berlin time.
  const targetDate = "2025-12-06T21:00:00";

  // Fetch remaining tickets
  useEffect(() => {
    const fetchRemainingTickets = async () => {
      try {
        const response = await fetch('/api/events/status');
        if (response.ok) {
          const data = await response.json();
          setRemainingTickets(data.remainingTickets);
        }
      } catch (error) {
        console.error('Error fetching remaining tickets:', error);
      }
    };

    fetchRemainingTickets();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchRemainingTickets, 30000);
    return () => clearInterval(interval);
  }, []);

  // Simulate live feed notifications
  useEffect(() => {
    const showNotification = () => {
      setShowLiveFeed(true);
      setTimeout(() => setShowLiveFeed(false), 3000);
    };

    // Show notification every 2-5 minutes
    const interval = setInterval(() => {
      const randomDelay = Math.random() * 180000 + 120000; // 2-5 minutes
      setTimeout(showNotification, randomDelay);
    }, 300000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-20 md:py-32 bg-gray-900/50 relative">
      {/* Live Feed Notification */}
      {showLiveFeed && (
        <div className="fixed bottom-4 right-4 bg-gray-800 border border-gray-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-pulse">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
            <span className="text-sm">Ein Platz im inneren Kreis wurde soeben besetzt.</span>
          </div>
        </div>
      )}
      
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
              {remainingTickets}
            </div>
            <div className="text-sm text-gray-400 tracking-wider">{t.next_event_spots_left}</div>
          </div>
        </div>
        
        <div className="flex flex-col items-center">
          <button onClick={onTicketClick} className="btn-exclusive bg-white text-black py-3 px-10 hover:bg-gray-200 tracking-wider font-semibold">
            {t.next_event_button}
          </button>
          <span className="text-xs text-gray-500 mt-2">{t.next_event_button_note}</span>
        </div>
      </div>
    </section>
  );
};

export default NextEventSection;