import React from 'react';

const MedusaLoader: React.FC = () => {
  return (
    <div className="relative flex items-center justify-center">
      <lottie-player
        autoplay
        loop
        mode="normal"
        src="/medusa/medusa-loop2-1_animation.json"
        style={{ width: '420px', height: '420px' }}
      ></lottie-player>
      <video
        className="absolute w-[420px] h-[420px] object-contain"
        autoPlay
        muted
        loop
        playsInline
        poster="/medusa/medusa-frame.png-hold"
      >
        <source src="/medusa/medusa_loop.mp4" type="video/mp4" />
      </video>
    </div>
  );
};

export default MedusaLoader;


