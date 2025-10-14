import React from 'react';

const ScrollIndicator: React.FC = () => {
  return (
    <div className="mt-8 text-center text-sm text-gray-400">
      <div className="inline-flex flex-col items-center opacity-75">
        <span>Scroll</span>
        <span className="block w-0.5 h-6 bg-gray-600 mt-1 animate-pulse"/>
      </div>
    </div>
  );
};

export default ScrollIndicator;


