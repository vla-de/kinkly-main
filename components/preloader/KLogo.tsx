import React, { useEffect, useRef } from 'react';

const KLogo: React.FC = () => {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      if (window.scrollY > 120) el.classList.add('k-logo-scrolled');
      else el.classList.remove('k-logo-scrolled');
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      ref={ref}
      aria-label="Kinkly"
      className="font-logo text-6xl md:text-7xl text-gray-300 k-logo-animate k-logo-outline"
      disabled
    >
      K
    </button>
  );
};

export default KLogo;


