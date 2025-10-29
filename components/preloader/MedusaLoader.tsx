import React from 'react';

const MedusaLoader: React.FC = () => {
  return (
    <div className="relative flex items-center justify-center">
      <img
        src="/medusa/medusa-frame.png"
        alt="Medusa"
        className="w-[420px] h-[420px] object-contain"
        loading="eager"
        draggable={false}
      />
    </div>
  );
};

export default MedusaLoader;


