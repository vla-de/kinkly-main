import React from 'react';

const ScrollIndicator: React.FC = () => {
  return (
    <>
      <style>{`
        @keyframes scroll-arrow {
          0%, 100% {
            transform: translateY(0);
            opacity: 0.6;
          }
          50% {
            transform: translateY(38px);
            opacity: 0.3;
          }
        }
        .animate-scroll-arrow {
          animation: scroll-arrow 2s ease-in-out infinite;
        }
      `}</style>
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-10">
        <div className="relative">
          <svg className="w-20 h-20 text-white/60 animate-scroll-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </>
  );
};

export default ScrollIndicator;


