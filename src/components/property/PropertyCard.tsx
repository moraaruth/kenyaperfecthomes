import React, { useState } from 'react';
import { Bed, Bath, Square, MapPin, Heart, ArrowUpRight, MessageCircle } from 'lucide-react';
import { Property } from '../../types';
import { formatKSh, formatArea, generateWhatsAppLink } from '../../lib/formatters';
import { getCoverImageUrl, transformForCard } from '../../lib/cloudinary';

interface PropertyCardProps {
  property: Property;
  isSaved?: boolean;
  onToggleSave?: (id: string) => void;
  onSelectProperty: (property: Property) => void;
  onBookViewing?: (property: Property) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  isSaved = false,
  onToggleSave,
  onSelectProperty,
  onBookViewing,
}) => {
  const [imgError, setImgError] = useState(false);

  const rawCover = getCoverImageUrl(property.images);
  const primaryImage = transformForCard(rawCover);

  const whatsappUrl = generateWhatsAppLink(property.title);

  return (
    <div className="group bg-white rounded-2xl border border-neutral-200/90 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden text-left relative">
      {/* IMAGE CONTAINER WITH 4:3 RATIO */}
      <div className="relative aspect-4/3 w-full bg-neutral-100 overflow-hidden cursor-pointer" onClick={() => onSelectProperty(property)}>
        {!imgError ? (
          <img
            src={primaryImage}
            alt={property.title}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-neutral-200 to-neutral-300 flex flex-col items-center justify-center p-4 text-center">
            <svg className="w-10 h-10 text-neutral-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
            <span className="text-xs font-semibold text-neutral-600">{property.title}</span>
          </div>
        )}

        {/* Gradient scrim for top buttons */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

        {/* Top Badges: Listing Type & Favorite */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between">
          <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-white/95 text-brand-900 shadow-sm backdrop-blur-xs">
            {property.listingType === 'Sale' ? 'For Sale' : 'For Rent'}
          </span>

        </div>

        {/* Price Tag Overlay (Matching Screenshot #3 & #8) */}
        <div className="absolute bottom-3 right-3">
          <span className="bg-brand-950/90 text-white font-extrabold text-sm sm:text-base px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/20 shadow-md">
            {formatKSh(property.price)}
            {property.listingType === 'Rent' && <span className="text-xs font-normal text-neutral-300">/mo</span>}
          </span>
        </div>
      </div>

      {/* CARD CONTENT */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Category Tag & Neighborhood */}
          <div className="flex items-center justify-between text-xs text-neutral-500 mb-1.5 font-medium">
            <span className="text-brand-800 font-semibold tracking-wide uppercase">{property.propertyType}</span>
            <span className="flex items-center gap-1 text-neutral-600">
              <MapPin className="w-3.5 h-3.5 text-brand-700" />
              {property.location.neighborhood}, {property.location.city}
            </span>
          </div>

          {/* Title */}
          <h3
            onClick={() => onSelectProperty(property)}
            className="text-base font-bold text-neutral-900 line-clamp-1 hover:text-brand-800 cursor-pointer transition-colors"
          >
            {property.title}
          </h3>

          {/* Key Specs Row (Screenshot #3 & #8: Beds, Baths, sqft) */}
          <div className="flex items-center gap-4 text-xs text-neutral-600 my-3.5 py-2.5 border-y border-neutral-100">
            <div className="flex items-center gap-1.5">
              <Bed className="w-4 h-4 text-neutral-400" />
              <span className="font-semibold text-neutral-800">{property.bedrooms}</span>
              <span>{property.bedrooms === 1 ? 'Bed' : 'Beds'}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Bath className="w-4 h-4 text-neutral-400" />
              <span className="font-semibold text-neutral-800">{property.bathrooms}</span>
              <span>{property.bathrooms === 1 ? 'Bath' : 'Baths'}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Square className="w-3.5 h-3.5 text-neutral-400" />
              <span className="font-semibold text-neutral-800">{property.squareFeet}</span>
              <span>sq ft</span>
            </div>
          </div>
        </div>

        {/* Action Buttons (Details button matching purple style from Screenshot #3 & #8) */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onSelectProperty(property)}
            className="flex-1 bg-brand-800 hover:bg-brand-900 text-white font-semibold text-sm py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <span>Details</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            title="Chat with agent on WhatsApp"
            className="p-2 rounded-lg border border-neutral-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
          >
            <MessageCircle className="w-5 h-5 fill-emerald-100" />
          </a>
        </div>
      </div>
    </div>
  );
};
