import React, { useEffect } from 'react';
import PricingTier from './PricingTier';
import { useLanguage } from '../contexts/LanguageContext';

interface MembershipSectionProps {
  onTierSelect: (tier: { title: string; price: string; }) => void;
}

const MembershipSection: React.FC<MembershipSectionProps> = ({ onTierSelect }) => {
  const { t } = useLanguage();

  // Extract serpent token from URL and store in sessionStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const serpentToken = urlParams.get('serpentToken');
    
    if (serpentToken) {
      sessionStorage.setItem('referralCode', serpentToken);
      // Clean up URL by removing the serpentToken parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('serpentToken');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, []);

  return (
    <section id="membership" className="py-20 md:py-32 bg-black">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="font-serif-display text-4xl md:text-5xl text-white mb-4">{t.membership_title}</h2>
          <p className="max-w-3xl mx-auto text-gray-400">
            {t.membership_paragraph}
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          <PricingTier 
            title={t.tier1_title}
            price="€995"
            description={t.tier1_desc}
            features={t.tier1_features}
            onSelect={() => onTierSelect({ title: t.tier1_title, price: '€995' })}
            ctaText={t.tier1_cta}
          />
          <PricingTier 
            title={t.tier2_title}
            price="€2.000"
            description={t.tier2_desc}
            features={t.tier2_features}
            isFeatured={true}
            onSelect={() => onTierSelect({ title: t.tier2_title, price: '€2.000' })}
            ctaText={t.tier2_cta}
          />
          <PricingTier 
            title={t.tier3_title}
            price="€10.000"
            description={t.tier3_desc}
            features={t.tier3_features}
            onSelect={() => onTierSelect({ title: t.tier3_title, price: '€10.000' })}
            ctaText={t.tier3_cta}
          />
        </div>
      </div>
    </section>
  );
};

export default MembershipSection;
