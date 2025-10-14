import React from 'react';

export type AnimationPhase = 'initial' | 'docking' | 'loading' | 'formVisible';

interface KLogoProps {
  phase: AnimationPhase;
  onTransitionEnd: () => void;
}

const KLogo: React.FC<KLogoProps> = ({ phase, onTransitionEnd }) => {
  const isDocked = phase === 'docking' || phase === 'loading' || phase === 'formVisible';

  const transformClasses = isDocked
    ? 'scale-[0.12] sm:scale-[0.14] md:scale-[0.15] translate-x-[calc(50vw-4rem)] -translate-y-[calc(50vh-4rem)] sm:translate-x-[calc(50vw-5rem)] sm:-translate-y-[calc(50vh-5rem)]'
    : 'scale-100';

  return (
    <div
      onTransitionEnd={onTransitionEnd}
      className={`fixed inset-0 flex items-center justify-center transition-transform duration-[1200ms] ease-[cubic-bezier(0.83,0,0.17,1)] z-20 pointer-events-none ${transformClasses}`}
    >
      <style>{`
        @keyframes draw-k { 0% { stroke-dashoffset: 2000; } 100% { stroke-dashoffset: 0; } }
        @keyframes fade-in-fill { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse-heartbeat { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes ripple-effect { from { transform: scale(1); opacity: .7; } to { transform: scale(2.5); opacity: 0; } }
        .k-pulse { animation: pulse-heartbeat 3s ease-in-out infinite; }
        .animate-ripples::before,.animate-ripples::after { content:''; position:absolute; top:0; left:0; width:100%; height:100%; border-radius:50%; border:1px solid rgba(255,255,255,.4); animation:ripple-effect 3s ease-out infinite; opacity:0; }
        .animate-ripples::after { animation-delay:1.5s; }
        .k-outline { font-family:'Cormorant', serif; font-weight:400; font-size:94px; fill:none; stroke:#404040; stroke-width:1.2; stroke-dasharray:2000; stroke-dashoffset:2000; animation:draw-k 2.5s cubic-bezier(0.68,-0.55,0.27,1.55) forwards; }
        .k-mask { font-family:'Cormorant', serif; font-weight:400; font-size:94px; fill:black; }
        .k-fill-white { font-family:'Cormorant', serif; font-weight:400; font-size:94px; fill:#404040; opacity:0; animation:fade-in-fill .8s ease-in 2.1s forwards; }
      `}</style>

      <div
        className={`relative w-[calc(100vw-15px)] h-[calc(100vw-15px)] sm:w-[calc(100vw-20px)] sm:h-[calc(100vw-20px)] lg:w-[calc(100vh-40px)] lg:h-[calc(100vh-40px)] ${isDocked ? 'k-pulse animate-ripples' : ''}`}
        style={{ WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden', WebkitTransform: 'translateZ(0)', transform: 'translateZ(0)', WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' }}
      >
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
          <text className="k-outline" x="50%" y="50%" dy=".3em" textAnchor="middle">K</text>
          <text className="k-mask" x="50%" y="50%" dy=".3em" textAnchor="middle">K</text>
          <text className="k-fill-white" x="50%" y="50%" dy=".3em" textAnchor="middle">K</text>
        </svg>
      </div>
    </div>
  );
};

export default KLogo;


