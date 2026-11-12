import React, { useState } from 'react';
import { Property, SearchFilters } from '../../types';
import { PropertyCard } from '../property/PropertyCard';
import { PropertyFilterBar } from '../property/PropertyFilterBar';
import { Search, RotateCcw } from 'lucide-react';

interface PropertiesPageProps {
  properties: Property[];
  savedIds: string[];
  onToggleSave: (id: string) => void;
  onSelectProperty: (property: Property) => void;
  initialFilters?: SearchFilters;
}

export const PropertiesPage: React.FC<PropertiesPageProps> = ({
  properties,
  savedIds,
  onToggleSave,
  onSelectProperty,
  initialFilters,
}) => {
  const [filters, setFilters] = useState<SearchFilters>(
    initialFilters || {
      keyword: '',
      propertyType: 'All',
      listingType: 'All',
      bedrooms: 'Any',
    }
  );

  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'newest'>('featured');

  // Null-safe, case-insensitive normalization so missing fields never throw during render
  const normalize = (value: unknown) => String(value ?? '').toLowerCase().trim();

  // Filter properties
  let filtered = properties.filter((p) => {
    const q = normalize(filters.keyword);
    if (q) {
      const searchable = [p.title, p.description, p.location?.neighborhood, p.location?.city, p.propertyType];
      if (!searchable.some((field) => normalize(field).includes(q))) return false;
    }

    if (filters.propertyType && filters.propertyType !== 'All') {
      if (normalize(p.propertyType) !== normalize(filters.propertyType)) return false;
    }

    if (filters.listingType && filters.listingType !== 'All') {
      if (normalize(p.listingType) !== normalize(filters.listingType)) return false;
    }

    if (filters.minPrice && p.price < filters.minPrice) return false;
    if (filters.maxPrice && p.price > filters.maxPrice) return false;

    if (filters.bedrooms && filters.bedrooms !== 'Any') {
      const minBeds = parseInt(filters.bedrooms, 10);
      if (!isNaN(minBeds) && p.bedrooms < minBeds) return false;
    }

    return true;
  });

  // Sort properties
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
  });

  return (
    <div className="min-h-screen bg-neutral-50/70 pb-24">
      {/* Top Banner (Screenshot #8: Purple strip) */}
      <div className="bg-brand-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-b-2 border-amber-400/40">
        <div className="max-w-7xl mx-auto text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Available Properties
          </h1>
          <p className="text-sm sm:text-base text-neutral-200 max-w-xl mx-auto">
            Discover apartments and studios for sale and rent in Nairobi.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Search & Filter Bar */}
        <PropertyFilterBar
          filters={filters}
          onChange={setFilters}
          onSearch={() => {}}
          totalCount={filtered.length}
        />

        {/* Sorting & Filter Pill Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-6 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Sort By:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-800 focus:outline-none focus:ring-1 focus:ring-brand-700"
            >
              <option value="featured">Featured / Recommended</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest Listed</option>
            </select>
          </div>

          <div className="text-xs text-neutral-500 font-medium">
            Showing <span className="font-bold text-neutral-900">{filtered.length}</span> of {properties.length} properties
          </div>
        </div>

        {/* Results Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 pt-8">
            {filtered.map((prop) => (
              <PropertyCard
                key={prop._id || prop.id}
                property={prop}
                isSaved={savedIds.includes(prop._id || prop.id || '')}
                onToggleSave={onToggleSave}
                onSelectProperty={onSelectProperty}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="py-20 text-center bg-white rounded-2xl border border-neutral-200 mt-8 p-8 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-1">No Properties Found</h3>
            <p className="text-sm text-neutral-500 mb-6">
              No listings matched your active search criteria. Try broadening your location, budget, or property type filters.
            </p>
            <button
              onClick={() =>
                setFilters({
                  keyword: '',
                  propertyType: 'All',
                  listingType: 'All',
                  bedrooms: 'Any',
                })
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-800 hover:bg-brand-900 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset All Filters</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
