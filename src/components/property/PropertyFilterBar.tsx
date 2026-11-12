import React, { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { SearchFilters } from '../../types';

interface PropertyFilterBarProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  onSearch: () => void;
  totalCount?: number;
}

export const PropertyFilterBar: React.FC<PropertyFilterBarProps> = ({
  filters,
  onChange,
  onSearch,
  totalCount,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const propertyTypes = ['All', 'Apartment', 'Studio', 'Villa', 'Townhouse', 'Commercial', 'Penthouse'];
  const bedroomOptions = ['Any', '1', '2', '3', '4'];

  const handleClear = () => {
    onChange({
      keyword: '',
      propertyType: 'All',
      listingType: 'All',
      minPrice: undefined,
      maxPrice: undefined,
      bedrooms: 'Any',
      location: '',
    });
  };

  const hasActiveFilters =
    Boolean(filters.keyword) ||
    (filters.propertyType && filters.propertyType !== 'All') ||
    (filters.listingType && filters.listingType !== 'All') ||
    Boolean(filters.minPrice) ||
    Boolean(filters.maxPrice) ||
    (filters.bedrooms && filters.bedrooms !== 'Any');

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-sm p-4 sm:p-5 space-y-4 text-left">
      {/* Primary Search Row (Direct match to Screenshot #1, #2, #8) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSearch();
        }}
        className="flex flex-col md:flex-row items-center gap-3"
      >
        {/* Keywords or Location Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.keyword}
            onChange={(e) => onChange({ ...filters, keyword: e.target.value })}
            placeholder="Enter Keywords or Location (e.g. Westlands, Karen, Studio...)"
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50/70 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-700 focus:border-transparent transition-all placeholder:text-neutral-400"
          />
        </div>

        {/* Property Type Dropdown */}
        <div className="w-full md:w-52">
          <select
            value={filters.propertyType}
            onChange={(e) => onChange({ ...filters, propertyType: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50/70 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-700 transition-all text-neutral-800"
          >
            {propertyTypes.map((t) => (
              <option key={t} value={t}>
                {t === 'All' ? 'All Property Types' : t}
              </option>
            ))}
          </select>
        </div>

        {/* Search & Toggle Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <button
            type="submit"
            className="flex-1 md:flex-initial bg-brand-800 hover:bg-brand-900 text-white font-bold text-sm px-7 py-3 rounded-xl transition-all shadow-sm hover:shadow active:scale-98"
          >
            Search
          </button>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`p-3 rounded-xl border transition-colors flex items-center justify-center ${
              showAdvanced || hasActiveFilters
                ? 'bg-brand-50 border-brand-300 text-brand-900 font-semibold'
                : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
            }`}
            title="Toggle more filters"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
      </form>

      {/* Advanced Filters Expandable Drawer */}
      {showAdvanced && (
        <div className="pt-4 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-150">
          {/* Listing Type: All, Sale, Rent */}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wider">
              Listing Purpose
            </label>
            <div className="flex rounded-lg bg-neutral-100 p-1">
              {['All', 'Sale', 'Rent'].map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => onChange({ ...filters, listingType: type })}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    filters.listingType === type
                      ? 'bg-white text-brand-950 shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {type === 'Sale' ? 'Buy' : type}
                </button>
              ))}
            </div>
          </div>

          {/* Bedrooms Selector */}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wider">
              Minimum Bedrooms
            </label>
            <div className="flex rounded-lg bg-neutral-100 p-1">
              {bedroomOptions.map((bed) => (
                <button
                  type="button"
                  key={bed}
                  onClick={() => onChange({ ...filters, bedrooms: bed })}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    (filters.bedrooms || 'Any') === bed
                      ? 'bg-white text-brand-950 shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {bed === 'Any' ? 'Any' : `${bed}+`}
                </button>
              ))}
            </div>
          </div>

          {/* Min Price */}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wider">
              Min Budget (KSh)
            </label>
            <input
              type="number"
              placeholder="e.g. 5,000,000"
              value={filters.minPrice || ''}
              onChange={(e) =>
                onChange({
                  ...filters,
                  minPrice: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-700"
            />
          </div>

          {/* Max Price */}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wider">
              Max Budget (KSh)
            </label>
            <input
              type="number"
              placeholder="e.g. 50,000,000"
              value={filters.maxPrice || ''}
              onChange={(e) =>
                onChange({
                  ...filters,
                  maxPrice: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-700"
            />
          </div>
        </div>
      )}

      {/* Active filters summary & Clear */}
      <div className="flex items-center justify-between text-xs text-neutral-500 pt-1">
        <span className="font-medium">
          {totalCount !== undefined ? `Showing ${totalCount} ${totalCount === 1 ? 'listing' : 'listings'}` : 'Browse homes across Kenya'}
        </span>

        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="text-brand-800 hover:text-brand-950 font-semibold flex items-center gap-1 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset filters</span>
          </button>
        )}
      </div>
    </div>
  );
};
