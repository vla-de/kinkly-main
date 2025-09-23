import React from 'react';
import PricingTier from './PricingTier';

interface MembershipSectionProps {
  onTicketClick: () => void;
}

const MembershipSection: React.FC<MembershipSectionProps> = ({ onTicketClick }) => {
  return (
    <section id="membership" className="py-20 md:py-32 bg-black">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="font-serif-display text-4xl md:text-5xl text-white mb-4">Choose Your Experience</h2>
          <p className="max-w-3xl mx-auto text-gray-400">
            Entry is not merely bought; it is granted. Note that opulence is our standard; champagne and caviar are but the beginning for all our guests.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          <PricingTier 
            title="The Invitation"
            price="€950"
            description="The key to a single, unforgettable night."
            features={[
              'Guaranteed access to one Kinkly event',
              'Welcome champagne & caviar bar',
              'Full access to all curated performances',
              'Inclusion in the pre-event communication',
            ]}
            onSelect={onTicketClick}
            ctaText="Request Access"
          />
          <PricingTier 
            title="The Black Card"
            price="€2.500"
            description="The preferred experience for our connoisseurs."
            features={[
              'All benefits of The Invitation',
              'Priority access with a separate entrance',
              'Exclusive access to the private Black Lounge',
              'A dedicated concierge for the evening',
              'An exclusive, curated welcome gift',
            ]}
            isFeatured={true}
            onSelect={onTicketClick}
            ctaText="Become a Member"
          />
          <PricingTier 
            title="The Sovereign"
            price="€10.000"
            description="The pinnacle of Kinkly for a single, unparalleled night."
            features={[
              'All benefits of The Black Card',
              'An exclusive, private suite for you and a guest',
              'Personal butler service for the entire event',
              'Curated selection of vintage spirits & private dining',
              'Direct line to the curator for bespoke requests',
            ]}
            onSelect={onTicketClick}
            ctaText="Inquire"
          />
        </div>
      </div>
    </section>
  );
};

export default MembershipSection;