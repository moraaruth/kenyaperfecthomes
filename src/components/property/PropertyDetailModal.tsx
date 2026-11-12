import React, { useState } from 'react';
import { X, Bed, Bath, Square, MapPin, Heart, Share2, Check, Phone, Mail, MessageCircle, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Property } from '../../types';
import { formatKSh, formatArea, generateWhatsAppLink } from '../../lib/formatters';
import {
  normalizePropertyImages,
  transformForGallery,
  transformForThumbnail,
} from '../../lib/cloudinary';

interface PropertyDetailModalProps {
  property: Property | null;
  onClose: () => void;
  isSaved?: boolean;
  onToggleSave?: (id: string) => void;
  onBookViewing?: (property: Property) => void;
}

export const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({
  property,
  onClose,
  isSaved = false,
  onToggleSave,
  onBookViewing,
}) => {
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!property) return null;

  const images = normalizePropertyImages(property.images);
  const activeImage = images[activeImgIndex] || images[0];

  const whatsappUrl = generateWhatsAppLink(property.title);

  const handleNextImage = () => {
    setActiveImgIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    setActiveImgIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative text-left border border-neutral-200">
        
        {/* Sticky top bar with close button */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-neutral-100 flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-800 bg-brand-50 px-2.5 py-1 rounded-md">
              {property.propertyType} · {property.listingType === 'Sale' ? 'For Sale' : 'For Rent'}
            </span>
     
          </div>

          <div className="flex items-center gap-2">
         
                    <button
              onClick={onClose}
              className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-8">
          
          {/* Main Gallery */}
          <div className="space-y-3">
            <div className="aspect-16/10 sm:aspect-16/9 rounded-xl overflow-hidden bg-neutral-100 relative shadow-inner">
              <img
                src={transformForGallery(activeImage.secureUrl)}
                alt={property.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-all shadow-md"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextImage}
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-all shadow-md"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                  <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-md">
                    {activeImgIndex + 1} / {images.length}
                  </div>
                </>
              )}

              <div className="absolute bottom-4 left-4 bg-brand-950/85 backdrop-blur-md text-white px-4 py-2 rounded-lg text-lg sm:text-xl font-extrabold border border-white/20">
                {formatKSh(property.price)}
                {property.listingType === 'Rent' && <span className="text-sm font-normal text-neutral-300">/month</span>}
              </div>
            </div>

            {/* Thumbnail selector */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={img.publicId || idx}
                    onClick={() => setActiveImgIndex(idx)}
                    className={`w-20 h-14 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                      activeImgIndex === idx ? 'border-brand-700 shadow-md scale-95' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={transformForThumbnail(img.secureUrl)} alt={`thumb ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title & Location Header */}
          <div className="border-b border-neutral-100 pb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight mb-2">
              {property.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
              <MapPin className="w-4 h-4 text-brand-700" />
              <span>
                {property.location.street ? `${property.location.street}, ` : ''}
                {property.location.neighborhood}, {property.location.city}, Kenya
              </span>
            </div>
          </div>

          {/* Key Specs Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-neutral-50 p-4 rounded-xl border border-neutral-200/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-brand-800">
                <Bed className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-neutral-500 font-medium">Bedrooms</p>
                <p className="text-base font-bold text-neutral-900">{property.bedrooms}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-brand-800">
                <Bath className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-neutral-500 font-medium">Bathrooms</p>
                <p className="text-base font-bold text-neutral-900">{property.bathrooms}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-brand-800">
                <Square className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-neutral-500 font-medium">Floor Area</p>
                <p className="text-base font-bold text-neutral-900">{formatArea(property.squareFeet)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-brand-800">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-neutral-500 font-medium">County</p>
                <p className="text-base font-bold text-neutral-900">{property.location.county || 'Nairobi'}</p>
              </div>
            </div>
          </div>

          {/* Rates Breakdown (Screenshot #12) */}
          {property.rates && (property.rates.monthly || property.rates.weekly || property.rates.daily || property.rates.sale) && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-neutral-900">Rates</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {property.rates.sale && (
                  <div className="p-3 bg-brand-50/50 rounded-lg border border-brand-100">
                    <span className="text-[11px] text-brand-800 font-semibold block uppercase">Purchase</span>
                    <span className="text-sm font-bold text-neutral-900">{formatKSh(property.rates.sale)}</span>
                  </div>
                )}
                {property.rates.monthly && (
                  <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                    <span className="text-[11px] text-neutral-500 font-semibold block uppercase">Monthly Rent</span>
                    <span className="text-sm font-bold text-neutral-900">{formatKSh(property.rates.monthly)}/mo</span>
                  </div>
                )}
                {property.rates.weekly && (
                  <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                    <span className="text-[11px] text-neutral-500 font-semibold block uppercase">Weekly Rate</span>
                    <span className="text-sm font-bold text-neutral-900">{formatKSh(property.rates.weekly)}/wk</span>
                  </div>
                )}
                {property.rates.daily && (
                  <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                    <span className="text-[11px] text-neutral-500 font-semibold block uppercase">Daily Stay</span>
                    <span className="text-sm font-bold text-neutral-900">{formatKSh(property.rates.daily)}/day</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-neutral-900">Property Overview</h3>
            <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
              {property.description}
            </p>
          </div>

          {/* Amenities & Features (Screenshot #12) */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-neutral-900">Amenities & Security Features</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {property.amenities.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg bg-neutral-50 border border-neutral-100 text-xs text-neutral-800 font-medium">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dedicated Agent & Action Card */}
          <div className="bg-linear-to-br from-brand-900 to-brand-950 text-white rounded-2xl p-6 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-brand-800/80 pb-5">
              <div>
                <span className="text-xs font-semibold text-amber-300 uppercase tracking-widest">Listing Managed By</span>
                <h4 className="text-xl font-bold text-white">{property.seller?.name || 'Ruth Moraa'}</h4>
                <p className="text-xs text-neutral-300">Certified Real Estate Advisor · Perfect Homes Kenya</p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`tel:${property.seller?.phone || '+254701029158'}`}
                  className="px-3.5 py-2 rounded-lg bg-brand-800 hover:bg-brand-700 text-xs font-bold flex items-center gap-1.5 transition-colors border border-brand-700"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Agent</span>
                </a>
                <a
                  href={`mailto:${property.seller?.email || 'phomeskenya@gmail.com'}`}
                  className="px-3.5 py-2 rounded-lg bg-brand-800 hover:bg-brand-700 text-xs font-bold flex items-center gap-1.5 transition-colors border border-brand-700"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email</span>
                </a>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => {
                  onClose();
                  onBookViewing?.(property);
                }}
                className="w-full sm:flex-1 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold py-3.5 px-6 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Schedule Private Viewing</span>
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-6 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5 fill-emerald-100" />
                <span>WhatsApp Instant Inquiry</span>
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
