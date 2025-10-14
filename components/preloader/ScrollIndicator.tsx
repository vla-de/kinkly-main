import React from 'react';

const ScrollIndicator: React.FC = () => {
  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 transition-opacity duration-500 z-10 opacity-70">
      <div className="animate-bounce">
        <svg className="w-6 h-6 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};

export default ScrollIndicator;


