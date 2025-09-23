import React from 'react';

const ExperienceCard: React.FC<{ imageUrl: string; title: string; description: string }> = ({ imageUrl, title, description }) => (
  <div className="group relative overflow-hidden">
    <img src={imageUrl} alt={title} className="w-full h-80 object-cover transform group-hover:scale-110 transition-transform duration-500" />
    <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col justify-end p-6">
      <h3 className="font-serif-display text-2xl text-white mb-2">{title}</h3>
      <p className="text-gray-300 text-sm">{description}</p>
    </div>
  </div>
);

const ExperienceSection: React.FC = () => {
  return (
    <section className="py-20 md:py-32 bg-black">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="font-serif-display text-4xl md:text-5xl text-white mb-4">The Experience</h2>
          <p className="max-w-3xl mx-auto text-gray-400">
            Every detail is meticulously curated to transport you to a world of dark elegance and unrestrained desire. From free-flowing champagne to epicurean delights, expect nothing less than perfection.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <ExperienceCard 
            imageUrl="/ambiance.jpg" 
            title="Mysterious Ambiance" 
            description="Lose yourself in a setting shrouded in mystery, where candlelight flickers and secrets linger in the air." 
          />
          <ExperienceCard 
            imageUrl="https://picsum.photos/800/600?random=2" 
            title="Exquisite Performances" 
            description="Witness captivating performances that blur the line between art and fantasy, designed to ignite your senses." 
          />
          <ExperienceCard 
            imageUrl="https://picsum.photos/800/600?random=3" 
            title="Curated Connections" 
            description="Mingle with a select group of individuals who, like you, appreciate the finer, darker things in life." 
          />
        </div>
      </div>
    </section>
  );
};

export default ExperienceSection;