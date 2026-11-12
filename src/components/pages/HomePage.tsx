import React from 'react';
import { HeroSection } from '../sections/HeroSection';
import { StatsStrip } from '../sections/StatsStrip';
import { WhyChooseUs } from '../sections/WhyChooseUs';
import { CtaBanner } from '../sections/CtaBanner';
import { PropertyCard } from '../property/PropertyCard';
import { Property, SearchFilters } from '../../types';
import { ArrowRight } from 'lucide-react';

interface HomePageProps {
  properties: Property[];
  savedIds: string[];
  onToggleSave: (id: string) => void;
  onSelectProperty: (property: Property) => void;
  onNavigate: (tab: string, filters?: SearchFilters) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  properties,
  savedIds,
  onToggleSave,
  onSelectProperty,
  onNavigate,
}) => {
  // Show recent / featured properties (first 3 to 6)
  const recentProperties = properties.slice(0, 6);

  const handleHeroSearch = (filters: SearchFilters) => {
    onNavigate('properties', filters);
  };

  const handleSelectNeighborhood = (neighborhood: string) => {
    onNavigate('properties', {
      keyword: neighborhood,
      propertyType: 'All',
      listingType: 'All',
    });
  };

  return (
    <div className="space-y-0">
      <HeroSection
        onSearch={handleHeroSearch}
        onSelectNeighborhood={handleSelectNeighborhood}
      />

      <StatsStrip />

      <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="text-3xl font-extrabold text-brand-900 tracking-tight">
            Recent Properties
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            The latest homes, apartments and commercial spaces added to our listings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {recentProperties.map((prop) => (
            <PropertyCard
              key={prop._id || prop.id}
              property={prop}
              isSaved={savedIds.includes(prop._id || prop.id || '')}
              onToggleSave={onToggleSave}
              onSelectProperty={onSelectProperty}
            />
          ))}
        </div>

        <div className="mt-12">
          <button
            onClick={() => onNavigate('properties')}
            className="inline-flex items-center gap-2 text-sm font-bold text-brand-800 hover:text-brand-950 transition-colors group"
          >
            <span>View all {properties.length} listings</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      <WhyChooseUs />

      <CtaBanner
        onBrowseProperties={() => onNavigate('properties')}
        onContactUs={() => onNavigate('contact')}
      />
    </div>
  );
};
