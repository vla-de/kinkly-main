import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface CountdownProps {
  targetDate: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
}

const Countdown: React.FC<CountdownProps> = ({ targetDate }) => {
  const { t } = useLanguage();

  const calculateTimeLeft = (): TimeLeft | {} => {
    const difference = +new Date(targetDate) - +new Date();
    let timeLeft: TimeLeft | {} = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const [displayTimeLeft, setDisplayTimeLeft] = useState(timeLeft);

  // Update the actual time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      const newTime = calculateTimeLeft();
      setTimeLeft(newTime);
      setDisplayTimeLeft(newTime); // Sync display time with actual time
    }, 60000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Trigger the glitch effect at random intervals
  useEffect(() => {
    let glitchTimeout: ReturnType<typeof setTimeout>;

    const scheduleGlitch = () => {
      const delay = Math.random() * 3000 + 2000; // Random delay between 2-5 seconds
      glitchTimeout = setTimeout(triggerGlitch, delay);
    };

    const triggerGlitch = () => {
      if (Object.keys(timeLeft).length === 0) return;

      // Random glitch type: 0 = all values, 1 = days only, 2 = hours only, 3 = minutes only
      const glitchType = Math.floor(Math.random() * 4);
      
      const glitchValue: TimeLeft = { ...timeLeft }; // Start with correct values
      
      if (glitchType === 0) {
        // All values glitch
        glitchValue.days = Math.floor(Math.random() * 99);
        glitchValue.hours = Math.floor(Math.random() * 24);
        glitchValue.minutes = Math.floor(Math.random() * 60);
      } else if (glitchType === 1) {
        // Only days glitch
        glitchValue.days = Math.floor(Math.random() * 99);
      } else if (glitchType === 2) {
        // Only hours glitch
        glitchValue.hours = Math.floor(Math.random() * 24);
      } else if (glitchType === 3) {
        // Only minutes glitch
        glitchValue.minutes = Math.floor(Math.random() * 60);
      }
      
      setDisplayTimeLeft(glitchValue);

      // Revert to the correct time after a short duration
      setTimeout(() => {
        setDisplayTimeLeft(timeLeft);
      }, 150); // Glitch is visible for 150ms

      scheduleGlitch(); // Schedule the next glitch
    };

    scheduleGlitch();

    return () => clearTimeout(glitchTimeout);
  }, [timeLeft]);

  const timeIntervals: { [key in keyof TimeLeft]: string } = {
    days: t.countdown_days,
    hours: t.countdown_hours,
    minutes: t.countdown_minutes,
  };

  const timerComponents: React.ReactElement[] = [];

  Object.keys(displayTimeLeft).forEach((interval) => {
    timerComponents.push(
      <div key={interval} className="text-center">
        <div className="text-3xl md:text-5xl font-bold text-white tabular-nums">
          {String(displayTimeLeft[interval as keyof TimeLeft]).padStart(2, '0')}
        </div>
        <div className="text-sm text-gray-400 tracking-wider uppercase">{timeIntervals[interval as keyof TimeLeft]}</div>
      </div>
    );
  });

  return (
    <div className="flex gap-4 md:gap-8">
      {timerComponents.length ? timerComponents : <span>{t.countdown_event_started}</span>}
      <style>{`.tabular-nums { font-variant-numeric: tabular-nums; }`}</style>
    </div>
  );
};

export default Countdown;