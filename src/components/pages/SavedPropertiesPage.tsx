import React from 'react';
import { Property } from '../../types';
import { PropertyCard } from '../property/PropertyCard';
import { Heart, Search } from 'lucide-react';

interface SavedPropertiesPageProps {
  properties: Property[];
  savedIds: string[];
  onToggleSave: (id: string) => void;
  onSelectProperty: (property: Property) => void;
  onBrowseMore: () => void;
}

export const SavedPropertiesPage: React.FC<SavedPropertiesPageProps> = ({
  properties,
  savedIds,
  onToggleSave,
  onSelectProperty,
  onBrowseMore,
}) => {
  const savedList = properties.filter((p) => savedIds.includes(p._id || p.id || ''));

  return (
    <div className="min-h-screen bg-neutral-50/70 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 text-left">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="border-b border-neutral-200 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full mb-2">
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>Saved Portfolio</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
              Saved Properties
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Your shortlisted Kenyan residences and investment opportunities.
            </p>
          </div>

          <div className="text-xs font-semibold text-neutral-600 bg-white px-4 py-2 rounded-xl border border-neutral-200">
            {savedList.length} {savedList.length === 1 ? 'property' : 'properties'} saved
          </div>
        </div>

        {/* Content */}
        {savedList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {savedList.map((prop) => (
              <PropertyCard
                key={prop._id || prop.id}
                property={prop}
                isSaved={true}
                onToggleSave={onToggleSave}
                onSelectProperty={onSelectProperty}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900">No Saved Properties Yet</h3>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Click the heart icon on any property card while browsing to save homes you want to inspect or compare later.
            </p>
            <div className="pt-2">
              <button
                onClick={onBrowseMore}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-800 hover:bg-brand-900 text-white font-bold text-xs transition-colors shadow-xs"
              >
                <Search className="w-4 h-4" />
                <span>Explore Properties</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
