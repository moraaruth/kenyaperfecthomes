import React, { useState } from 'react';
import { Property, PropertyType, ListingType, PropertyImage } from '../../types';
import { addProperty } from '../../lib/propertyStore';
import { toSquareFeet } from '../../lib/formatters';
import { PropertyImageUploader } from '../property/PropertyImageUploader';
import { PlusCircle, CheckCircle2, MapPin, UserCheck, Sparkles } from 'lucide-react';

import { AdminUser } from '../../lib/authClient';

interface AddPropertyPageProps {
  onPropertyAdded: (newProp: Property) => void;
  onBrowseProperties: () => void;
  adminUser?: AdminUser | null;
}

export const AddPropertyPage: React.FC<AddPropertyPageProps> = ({
  onPropertyAdded,
  onBrowseProperties,
  adminUser,
}) => {
  const [propertyType, setPropertyType] = useState<PropertyType>('Apartment');
  const [listingNames, setListingNames] = useState('');
  const [description, setDescription] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('Nairobi');
  const [neighborhood, setNeighborhood] = useState('Westlands');
  const [beds, setBeds] = useState('2');
  const [baths, setBaths] = useState('2');
  const [squareMeters, setSquareMeters] = useState('102');

  // Amenities from Screenshot #12
  const availableAmenities = [
    'Dishwasher',
    'Gym/Fitness Center',
    'Air Conditioning',
    'Balcony/Patio',
    'Smart TV',
    'Coffee Maker',
    'Swimming Pool',
    'High Speed Internet',
    '24/7 Security',
    'Backup Generator',
    'Borehole Water',
    'Parking',
  ];
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'Balcony/Patio',
    '24/7 Security',
    'High Speed Internet',
  ]);

  // Rates from Screenshot #12
  const [rateWeekly, setRateWeekly] = useState('');
  const [rateSale, setRateSale] = useState('');
  const [rateMonthly, setRateMonthly] = useState('');
  const [rateDaily, setRateDaily] = useState('');

  // Seller Details (Screenshot #12)
  const [sellerName, setSellerName] = useState(adminUser?.name || 'Ruth Moraa');
  const [sellerEmail, setSellerEmail] = useState(adminUser?.email || '');
  const [sellerPhone, setSellerPhone] = useState('+254701029158');

  // Cloudinary Property Images State
  const [uploadedImages, setUploadedImages] = useState<PropertyImage[]>([
    {
      publicId: 'initial_nairobi_cover',
      secureUrl: '/images/property_westlands_apartment_1794311302942.jpg',
      format: 'jpg',
      resourceType: 'image',
      sortOrder: 0,
      isCover: true,
      originalFilename: 'westlands_luxury_interior.jpg',
    },
  ]);

  // High-Fidelity Quick Preset Catalog
  const presetShortcuts = [
    {
      label: 'Karen Villa Exterior',
      url: '/images/property_karen_villa_1794311303595.jpg',
    },
    {
      label: 'Kilimani Penthouse Terrace',
      url: '/images/property_kilimani_penthouse_1794311304830.jpg',
    },
    {
      label: 'Chic Modern Studio',
      url: '/images/property_studio_modern_1794311304710.jpg',
    },
    {
      label: 'Sunset Infinity Pool Villa',
      url: '/images/hero_nairobi_luxury_home_1794311302389.jpg',
    },
  ];

  const handleAddPreset = (preset: { label: string; url: string }) => {
    setUploadedImages((prev) => [
      ...prev,
      {
        publicId: `preset_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        secureUrl: preset.url,
        format: 'jpg',
        resourceType: 'image',
        sortOrder: prev.length,
        isCover: prev.length === 0,
        originalFilename: preset.label,
      },
    ]);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdProperty, setCreatedProperty] = useState<Property | null>(null);

  const toggleAmenity = (name: string) => {
    if (selectedAmenities.includes(name)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== name));
    } else {
      setSelectedAmenities([...selectedAmenities, name]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listingNames || !description) {
      alert('Please fill out listing name and description.');
      return;
    }

    if (uploadedImages.length === 0) {
      alert('Please upload or select at least one property photo.');
      return;
    }

    const saleVal = rateSale ? Number(rateSale) : 0;
    const monthlyVal = rateMonthly ? Number(rateMonthly) : 0;
    const primaryPrice = saleVal > 0 ? saleVal : monthlyVal > 0 ? monthlyVal : 6500000;
    const listingType: ListingType = saleVal > 0 ? 'Sale' : 'Rent';

    setIsSubmitting(true);
    try {
      const newProp = await addProperty({
        title: listingNames,
        description,
        propertyType,
        listingType,
        price: primaryPrice,
        rates: {
          weekly: rateWeekly ? Number(rateWeekly) : undefined,
          sale: saleVal || undefined,
          monthly: monthlyVal || undefined,
          daily: rateDaily ? Number(rateDaily) : undefined,
        },
        currency: 'KSh',
        location: {
          street: street || 'Muthithi Road',
          city: city || 'Nairobi',
          neighborhood: neighborhood || 'Westlands',
          county: 'Nairobi',
        },
        bedrooms: Number(beds) || 1,
        bathrooms: Number(baths) || 1,
        squareFeet: Number(squareMeters) ? toSquareFeet(Number(squareMeters)) : 500,
        images: uploadedImages,
        amenities: selectedAmenities,
        featured: false,
        status: 'Available',
        seller: {
          name: sellerName || 'Ruth Moraa',
          email: sellerEmail || 'phomeskenya@gmail.com',
          phone: sellerPhone || '+254701029158',
        },
      });

      setCreatedProperty(newProp);
      onPropertyAdded(newProp);
    } catch (err) {
      alert(err instanceof Error ? `Failed to publish listing: ${err.message}` : 'Failed to publish listing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100/60 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 text-left">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header (Screenshot #11: "Add Property") */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
              List Your Asset
            </span>
            {adminUser && (
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Admin: {adminUser.name}</span>
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
            Add Property
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 max-w-xl mx-auto">
            Submit a verified real estate listing with high-resolution mobile camera or desktop photos.
          </p>
        </div>

        {createdProperty ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 sm:p-10 shadow-lg text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900">Property Successfully Listed!</h2>
            <p className="text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
              "{createdProperty.title}" is now published and stored with {uploadedImages.length} optimized Cloudinary images.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setCreatedProperty(null)}
                className="px-6 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 font-semibold text-xs hover:bg-neutral-50 transition-colors"
              >
                Add Another Property
              </button>
              <button
                onClick={onBrowseProperties}
                className="px-6 py-2.5 rounded-xl bg-brand-800 hover:bg-brand-900 text-white font-semibold text-xs transition-colors shadow-xs"
              >
                View Marketplace
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-neutral-200/90 shadow-xl p-6 sm:p-10 space-y-7">
            
            {/* Property Type (Screenshot #11) */}
            <div>
              <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">
                Property Type
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50/60 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-700 text-neutral-800"
              >
                <option value="Apartment">Apartment</option>
                <option value="Studio">Studio</option>
                <option value="Villa">Villa</option>
                <option value="Townhouse">Townhouse</option>
                <option value="Commercial">Commercial</option>
                <option value="Penthouse">Penthouse</option>
              </select>
            </div>

            {/* Listing Names (Screenshot #11) */}
            <div>
              <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">
                Listing Names
              </label>
              <input
                type="text"
                required
                value={listingNames}
                onChange={(e) => setListingNames(e.target.value)}
                placeholder="eg. Beautiful Apartment In Nairobi"
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50/60 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-700 placeholder:text-neutral-400"
              />
            </div>

            {/* Description (Screenshot #11) */}
            <div>
              <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">
                Description
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add an optional description of your property"
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50/60 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-700 placeholder:text-neutral-400 resize-none"
              />
            </div>

            {/* Location (Screenshot #11: Street & City) */}
            <div className="bg-brand-950 text-white p-5 rounded-xl space-y-4">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-200">
                <MapPin className="w-4 h-4 text-amber-300" />
                <span>Location</span>
              </label>
              <div className="space-y-3">
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Street (e.g. Muthithi Road, Parklands Rd)"
                  className="w-full px-4 py-2.5 rounded-lg bg-white/10 text-white placeholder:text-neutral-400 text-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Neighborhood (e.g. Westlands)"
                    className="w-full px-4 py-2.5 rounded-lg bg-white/10 text-white placeholder:text-neutral-400 text-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City (e.g. Nairobi)"
                    className="w-full px-4 py-2.5 rounded-lg bg-white/10 text-white placeholder:text-neutral-400 text-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </div>
              </div>
            </div>

            {/* Beds, Baths, Square Meters (Screenshot #11) */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">
                  Beds
                </label>
                <input
                  type="number"
                  min="0"
                  value={beds}
                  onChange={(e) => setBeds(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50/60 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">
                  Baths
                </label>
                <input
                  type="number"
                  min="0"
                  value={baths}
                  onChange={(e) => setBaths(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50/60 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">
                  Square Meters (m²)
                </label>
                <input
                  type="number"
                  min="0"
                  value={squareMeters}
                  onChange={(e) => setSquareMeters(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50/60 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-700"
                />
              </div>
            </div>

            {/* Amenities Checkboxes (Screenshot #12) */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider">
                Amenities & Features
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availableAmenities.map((amenity) => {
                  const checked = selectedAmenities.includes(amenity);
                  return (
                    <label
                      key={amenity}
                      onClick={() => toggleAmenity(amenity)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                        checked
                          ? 'bg-brand-50 border-brand-300 text-brand-950 font-semibold'
                          : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {}}
                        className="rounded text-brand-700 focus:ring-brand-700"
                      />
                      <span>{amenity}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Rates Box (Screenshot #12: Weekly, Sale, Monthly, Daily) */}
            <div className="bg-brand-950 text-white p-5 rounded-xl space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-200">
                Rates (Leave blank if not applicable)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[11px] text-neutral-300 block mb-1">Weekly</span>
                  <input
                    type="number"
                    value={rateWeekly}
                    onChange={(e) => setRateWeekly(e.target.value)}
                    placeholder="Weekly"
                    className="w-full px-3 py-2 rounded-lg bg-white/10 text-white text-xs border border-white/20 focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-neutral-300 block mb-1">Sale</span>
                  <input
                    type="number"
                    value={rateSale}
                    onChange={(e) => setRateSale(e.target.value)}
                    placeholder="Sale (KSh)"
                    className="w-full px-3 py-2 rounded-lg bg-white/10 text-white text-xs border border-white/20 focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-neutral-300 block mb-1">Monthly</span>
                  <input
                    type="number"
                    value={rateMonthly}
                    onChange={(e) => setRateMonthly(e.target.value)}
                    placeholder="Monthly"
                    className="w-full px-3 py-2 rounded-lg bg-white/10 text-white text-xs border border-white/20 focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-neutral-300 block mb-1">Daily</span>
                  <input
                    type="number"
                    value={rateDaily}
                    onChange={(e) => setRateDaily(e.target.value)}
                    placeholder="Daily"
                    className="w-full px-3 py-2 rounded-lg bg-white/10 text-white text-xs border border-white/20 focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </div>
              </div>
            </div>

            {/* Seller Contact Info (Screenshot #12) */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-brand-700" />
                <span>Seller & Contact Representative</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] text-neutral-600 mb-1 font-semibold">Seller Name</label>
                  <input
                    type="text"
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                    placeholder="Name"
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50/60 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-700"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-neutral-600 mb-1 font-semibold">Seller Email</label>
                    <input
                      type="email"
                      value={sellerEmail}
                      onChange={(e) => setSellerEmail(e.target.value)}
                      placeholder="Email address"
                      className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50/60 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-600 mb-1 font-semibold">Seller Phone Number</label>
                    <input
                      type="tel"
                      value={sellerPhone}
                      onChange={(e) => setSellerPhone(e.target.value)}
                      placeholder="Phone"
                      className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50/60 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-700"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CLOUDINARY PROPERTY IMAGE UPLOADER */}
            <div className="space-y-4 pt-4 border-t border-neutral-200">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-900">
                  Cloudinary Property Photos
                </label>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Upload directly from iPhone/Android cameras, photo library, or drag & drop files. Automatic HEIC/HEIF conversion and delivery optimization.
                </p>
              </div>

              {/* Full Interactive Uploader */}
              <PropertyImageUploader
                images={uploadedImages}
                onChange={setUploadedImages}
                maxFiles={50}
                maxSizeMB={25}
              />

              {/* Quick Append Verified Shortcuts */}
            
            </div>

            {/* Submit Button (Screenshot #12: Purple button "Add Property") */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-brand-800 hover:bg-brand-900 disabled:opacity-70 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-98 flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-5 h-5 text-amber-300" />
              <span>{isSubmitting ? 'Publishing Property...' : 'Add Property'}</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
