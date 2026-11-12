import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { SearchFilters } from '../../types';

interface HeroSectionProps {
  onSearch: (filters: SearchFilters) => void;
  onSelectNeighborhood: (neighborhood: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onSearch, onSelectNeighborhood }) => {
  const [keyword, setKeyword] = useState('');
  const [propertyType, setPropertyType] = useState('All');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      keyword,
      propertyType,
      listingType: 'All',
      bedrooms: 'Any',
    });
  };

  const neighborhoods = ['Westlands', 'Karen', 'Kilimani', 'Riverside', 'Lavington', 'Kileleshwa'];

  return (
    <section className="relative min-h-[600px] lg:min-h-[640px] flex items-center justify-center overflow-hidden bg-neutral-900">
      <img
        src="/src/assets/images/hero_nairobi_luxury_home_1794311302389.jpg"
        alt="Modern home in Nairobi"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-black/75" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight mb-4 max-w-3xl mx-auto">
          Find Where You Belong
        </h1>

        <p className="text-lg sm:text-xl text-neutral-200 max-w-xl mx-auto mb-10">
          Homes, apartments and commercial spaces to buy or rent across Kenya.
        </p>

        <div className="max-w-3xl mx-auto bg-black/50 p-3 sm:p-4 rounded-lg">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            {/* Location or Keyword Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-5 h-5 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Enter Keywords or Location"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-inner placeholder:text-neutral-400 font-medium"
              />
            </div>

            {/* Property Type Dropdown */}
            <div className="w-full sm:w-44">
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-white text-neutral-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer shadow-inner"
              >
                <option value="All">All Types</option>
                <option value="Apartment">Apartment</option>
                <option value="Studio">Studio</option>
                <option value="Villa">Villa</option>
                <option value="Commercial">Commercial</option>
            
              </select>
            </div>

            {/* Purple Search Button (Screenshot #1: "Search") */}
            <button
              type="submit"
              className="w-full sm:w-auto bg-brand-700 hover:bg-brand-800 text-white font-bold text-sm px-8 py-3.5 rounded-xl transition-colors shrink-0"
            >
              Search
            </button>
          </form>

          <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-neutral-300 font-medium">Popular Areas:</span>
            {neighborhoods.map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => onSelectNeighborhood(area)}
                className="px-2.5 py-1 rounded-md bg-white/15 hover:bg-white/25 text-white transition-colors"
              >
                {area}
              </button>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
