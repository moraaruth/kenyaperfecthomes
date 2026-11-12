import React, { useState } from 'react';
import { Property, PropertyType, ListingType, PropertyImage } from '../../types';
import { updateProperty } from '../../lib/propertyStore';
import { PropertyImageUploader } from '../property/PropertyImageUploader';
import { CheckCircle2, MapPin, UserCheck, Save, ArrowLeft } from 'lucide-react';
import { AdminUser } from '../../lib/authClient';

interface EditPropertyPageProps {
  property: Property;
  adminUser?: AdminUser | null;
  onPropertyUpdated: (updated: Property) => void;
  onCancel: () => void;
}

const availableAmenities = [
  'Dishwasher', 'Gym/Fitness Center', 'Air Conditioning', 'Balcony/Patio',
  'Smart TV', 'Coffee Maker', 'Swimming Pool', 'High Speed Internet',
  '24/7 Security', 'Backup Generator', 'Borehole Water', 'Parking',
];

export const EditPropertyPage: React.FC<EditPropertyPageProps> = ({
  property,
  adminUser,
  onPropertyUpdated,
  onCancel,
}) => {
  const [propertyType, setPropertyType] = useState<PropertyType>(property.propertyType);
  const [title, setTitle] = useState(property.title);
  const [description, setDescription] = useState(property.description);
  const [street, setStreet] = useState(property.location?.street || '');
  const [city, setCity] = useState(property.location?.city || 'Nairobi');
  const [neighborhood, setNeighborhood] = useState(property.location?.neighborhood || 'Westlands');
  const [beds, setBeds] = useState(String(property.bedrooms));
  const [baths, setBaths] = useState(String(property.bathrooms));
  const [squareFeet, setSquareFeet] = useState(String(property.squareFeet));
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(property.amenities || []);
  const [rateWeekly, setRateWeekly] = useState(String(property.rates?.weekly || ''));
  const [rateSale, setRateSale] = useState(String(property.rates?.sale || ''));
  const [rateMonthly, setRateMonthly] = useState(String(property.rates?.monthly || ''));
  const [rateDaily, setRateDaily] = useState(String(property.rates?.daily || ''));
  const [sellerName, setSellerName] = useState(property.seller?.name || adminUser?.name || '');
  const [sellerEmail, setSellerEmail] = useState(property.seller?.email || adminUser?.email || '');
  const [sellerPhone, setSellerPhone] = useState(property.seller?.phone || '');
  const [uploadedImages, setUploadedImages] = useState<PropertyImage[]>(
    (property.images || []).map((img, i) =>
      typeof img === 'string'
        ? { publicId: `img_${i}`, secureUrl: img, format: 'jpg', resourceType: 'image', sortOrder: i, isCover: i === 0 }
        : img
    ) as PropertyImage[]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleAmenity = (name: string) =>
    setSelectedAmenities((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) { setError('Title and description are required.'); return; }
    if (uploadedImages.length === 0) { setError('At least one photo is required.'); return; }

    const saleVal = rateSale ? Number(rateSale) : 0;
    const monthlyVal = rateMonthly ? Number(rateMonthly) : 0;
    const primaryPrice = saleVal > 0 ? saleVal : monthlyVal > 0 ? monthlyVal : property.price;
    const listingType: ListingType = saleVal > 0 ? 'Sale' : 'Rent';

    const updates: Partial<Property> = {
      title,
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
      location: { street: street || undefined, city, neighborhood, county: 'Nairobi' },
      bedrooms: Number(beds) || 1,
      bathrooms: Number(baths) || 1,
      squareFeet: Number(squareFeet) || 500,
      images: uploadedImages,
      amenities: selectedAmenities,
      seller: { name: sellerName, email: sellerEmail, phone: sellerPhone },
    };

    setIsSubmitting(true);
    setError(null);
    try {
      const propId = property._id || property.id || '';
      const updated = await updateProperty(propId, updates);
      if (!updated) throw new Error('Update returned null.');
      setSaved(true);
      onPropertyUpdated(updated);
      setTimeout(() => onCancel(), 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50/60 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-700';
  const labelCls = 'block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2';

  return (
    <div className="min-h-screen bg-neutral-100/60 py-10 px-4 sm:px-6 lg:px-8 text-left">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button type="button" onClick={onCancel} className="p-2 rounded-lg hover:bg-neutral-200 transition-colors">
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">Edit Property</h1>
            <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{property.title}</p>
          </div>
        </div>

        {saved && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            Changes saved successfully. Returning to listings...
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-neutral-200/90 shadow-xl p-6 sm:p-10 space-y-7">

          {/* Property Type */}
          <div>
            <label className={labelCls}>Property Type</label>
            <select value={propertyType} onChange={(e) => setPropertyType(e.target.value as PropertyType)} className={inputCls}>
              {['Apartment','Studio','Villa','Townhouse','Commercial','Penthouse'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className={labelCls}>Listing Title</label>
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description</label>
            <textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputCls} resize-none`} />
          </div>

          {/* Location */}
          <div className="bg-brand-950 text-white p-5 rounded-xl space-y-4">
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-200">
              <MapPin className="w-4 h-4 text-amber-300" /> Location
            </label>
            <input type="text" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Street" className="w-full px-4 py-2.5 rounded-lg bg-white/10 text-white placeholder:text-neutral-400 text-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-amber-300" />
            <div className="grid grid-cols-2 gap-3">
              <input type="text" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Neighborhood" className="w-full px-4 py-2.5 rounded-lg bg-white/10 text-white placeholder:text-neutral-400 text-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-amber-300" />
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="w-full px-4 py-2.5 rounded-lg bg-white/10 text-white placeholder:text-neutral-400 text-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-amber-300" />
            </div>
          </div>

          {/* Beds / Baths / sqft */}
          <div className="grid grid-cols-3 gap-4">
            {[['Beds', beds, setBeds], ['Baths', baths, setBaths], ['Square Feet', squareFeet, setSquareFeet]].map(([lbl, val, setter]) => (
              <div key={lbl as string}>
                <label className={labelCls}>{lbl as string}</label>
                <input type="number" min="0" value={val as string} onChange={(e) => (setter as any)(e.target.value)} className={inputCls} />
              </div>
            ))}
          </div>

          {/* Amenities */}
          <div className="space-y-3">
            <label className={labelCls}>Amenities</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {availableAmenities.map((amenity) => {
                const checked = selectedAmenities.includes(amenity);
                return (
                  <label key={amenity} onClick={() => toggleAmenity(amenity)} className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${checked ? 'bg-brand-50 border-brand-300 text-brand-950 font-semibold' : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'}`}>
                    <input type="checkbox" checked={checked} onChange={() => {}} className="rounded text-brand-700 focus:ring-brand-700" />
                    {amenity}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Rates */}
          <div className="bg-brand-950 text-white p-5 rounded-xl space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-200">Rates (KSh)</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[['Weekly', rateWeekly, setRateWeekly], ['Sale', rateSale, setRateSale], ['Monthly', rateMonthly, setRateMonthly], ['Daily', rateDaily, setRateDaily]].map(([lbl, val, setter]) => (
                <div key={lbl as string}>
                  <span className="text-[11px] text-neutral-300 block mb-1">{lbl as string}</span>
                  <input type="number" value={val as string} onChange={(e) => (setter as any)(e.target.value)} placeholder={lbl as string} className="w-full px-3 py-2 rounded-lg bg-white/10 text-white text-xs border border-white/20 focus:outline-none focus:ring-2 focus:ring-amber-300" />
                </div>
              ))}
            </div>
          </div>

          {/* Seller */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-brand-700" /> Seller Contact
            </h3>
            <input type="text" value={sellerName} onChange={(e) => setSellerName(e.target.value)} placeholder="Seller Name" className={inputCls} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="email" value={sellerEmail} onChange={(e) => setSellerEmail(e.target.value)} placeholder="Seller Email" className={inputCls} />
              <input type="tel" value={sellerPhone} onChange={(e) => setSellerPhone(e.target.value)} placeholder="Seller Phone" className={inputCls} />
            </div>
          </div>

          {/* Images */}
          <div className="space-y-3 pt-4 border-t border-neutral-200">
            <label className={labelCls}>Property Photos</label>
            <PropertyImageUploader images={uploadedImages} onChange={setUploadedImages} maxFiles={50} maxSizeMB={25} />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={isSubmitting || saved} className="flex-1 bg-brand-800 hover:bg-brand-900 disabled:opacity-60 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2">
              <Save className="w-4 h-4 text-amber-300" />
              {isSubmitting ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
            </button>
            <button type="button" onClick={onCancel} className="px-6 py-4 rounded-xl border border-neutral-300 text-neutral-700 font-semibold text-sm hover:bg-neutral-50 transition-colors">
              Cancel
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
