import React from 'react';

const ScrollIndicator: React.FC = () => {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 transition-opacity duration-500 z-10 opacity-50">
      <div className="animate-pulse">
        <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};

export default ScrollIndicator;


