import React, { useState, useEffect } from 'react';

const MedusaLoader: React.FC = () => {
  const [showVideo, setShowVideo] = useState(false);
  const [lottieError, setLottieError] = useState(false);

  useEffect(() => {
    // Check if lottie-player is available
    const checkLottie = () => {
      if (typeof window !== 'undefined' && window.customElements) {
        if (!window.customElements.get('lottie-player')) {
          // Lottie not available, show video after short delay
          setTimeout(() => setShowVideo(true), 500);
        }
      } else {
        // Fallback for older browsers
        setTimeout(() => setShowVideo(true), 800);
      }
    };

    checkLottie();
  }, []);

  const handleLottieError = () => {
    setLottieError(true);
    setShowVideo(true);
  };

  return (
    <div className="relative flex items-center justify-center">
      {!showVideo && !lottieError && (
        <lottie-player
          autoplay
          loop
          mode="normal"
          src="/medusa/medusa-loop2-1_animation.json"
          style={{ width: '420px', height: '420px' }}
          onError={handleLottieError}
        ></lottie-player>
      )}
      <video
        className={`w-[420px] h-[420px] object-contain ${!showVideo && !lottieError ? 'absolute opacity-0' : 'opacity-100'}`}
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


