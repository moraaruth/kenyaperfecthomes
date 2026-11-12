import React, { useState } from 'react';
import { User, Mail, Phone, Calendar, MapPin, Home, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import { submitBooking } from '../../lib/propertyStore';
import { Property } from '../../types';
import { getCoverImageUrl } from '../../lib/cloudinary';

interface BookingPageProps {
  preselectedProperty?: Property | null;
  properties: Property[];
  onBrowseMore: () => void;
}

export const BookingPage: React.FC<BookingPageProps> = ({
  preselectedProperty,
  properties,
  onBrowseMore,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [month, setMonth] = useState('December');
  const [day, setDay] = useState('15');
  const [year, setYear] = useState('2025');
  const [location, setLocation] = useState(preselectedProperty?.location.neighborhood || 'Westlands');
  const [houseType, setHouseType] = useState<string>(preselectedProperty?.propertyType || 'Apartment');
  const [selectedPropId, setSelectedPropId] = useState(preselectedProperty?._id || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1));
  const years = ['2025', '2026', '2027'];
  const locations = ['Westlands', 'Karen', 'Kilimani', 'Riverside', 'Lavington', 'Kileleshwa', 'Parklands'];
  const houseTypes = ['Apartment', 'Studio', 'Villa', 'Townhouse', 'Commercial', 'Penthouse'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !contact) {
      alert('Please fill out all contact information fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedProp = properties.find((p) => (p._id || p.id) === selectedPropId);
      const res = await submitBooking({
        firstName,
        lastName,
        email,
        contact,
        preferredDate: { month, day, year },
        location,
        houseType,
        propertyId: selectedProp?._id || selectedProp?.id,
        propertyTitle: selectedProp?.title,
      });

      setSuccessMessage(res.message);
      setSubmitSuccess(true);
    } catch (err) {
      alert('Failed to submit appointment. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50/70 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 text-left">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Page Header (Screenshot #9: "Book a Property View") */}
        <div className="text-center space-y-2">
        
          <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-900 tracking-tight">
            Book a Property View
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 max-w-xl mx-auto leading-relaxed">
            Schedule a viewing appointment for your dream property. Fill out the form below and we'll get back to you shortly.
          </p>
        </div>

        {/* Selected Property Preview Banner if navigating from a card */}
        {preselectedProperty && (
          <div className="p-4 bg-white rounded-xl border border-brand-200 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={getCoverImageUrl(preselectedProperty.images)}
                alt={preselectedProperty.title}
                className="w-16 h-12 rounded-lg object-cover"
              />
              <div>
                <span className="text-[11px] text-brand-700 font-bold uppercase">Preselected Property</span>
                <p className="text-sm font-bold text-neutral-900">{preselectedProperty.title}</p>
                <p className="text-xs text-neutral-500">{preselectedProperty.location.neighborhood}, {preselectedProperty.location.city}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onBrowseMore}
              className="text-xs font-semibold text-brand-800 hover:underline shrink-0"
            >
              Change
            </button>
          </div>
        )}

        {/* Form Card (Screenshot #9) */}
        <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-lg p-6 sm:p-10">
          {submitSuccess ? (
            <div className="py-10 text-center space-y-4 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900">Viewing Appointment Confirmed!</h3>
              <p className="text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
                {successMessage}
              </p>
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setSubmitSuccess(false);
                    setFirstName('');
                    setLastName('');
                    setEmail('');
                    setContact('');
                  }}
                  className="px-6 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 font-semibold text-xs hover:bg-neutral-50 transition-colors"
                >
                  Book Another Viewing
                </button>
                <button
                  onClick={onBrowseMore}
                  className="px-6 py-2.5 rounded-xl bg-brand-800 hover:bg-brand-900 text-white font-semibold text-xs transition-colors shadow-xs"
                >
                  Return to Properties
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Row 1: First Name & Last Name (Screenshot #9) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-brand-950 uppercase tracking-wider mb-2">
                    <User className="w-3.5 h-3.5 text-brand-700" />
                    <span>First Name</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter your first name"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50/60 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-700 placeholder:text-neutral-400"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-brand-950 uppercase tracking-wider mb-2">
                    <User className="w-3.5 h-3.5 text-brand-700" />
                    <span>Last Name</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter your last name"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50/60 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-700 placeholder:text-neutral-400"
                  />
                </div>
              </div>

              {/* Row 2: Email & Contact (Screenshot #9) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-brand-950 uppercase tracking-wider mb-2">
                    <Mail className="w-3.5 h-3.5 text-brand-700" />
                    <span>Email</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50/60 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-700 placeholder:text-neutral-400"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-brand-950 uppercase tracking-wider mb-2">
                    <Phone className="w-3.5 h-3.5 text-brand-700" />
                    <span>Contact (Phone)</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="Enter your phone number (e.g. 0701029158)"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50/60 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-700 placeholder:text-neutral-400"
                  />
                </div>
              </div>

              {/* Row 3: Preferred Date: Month, Day, Year (Screenshot #9) */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-brand-950 uppercase tracking-wider mb-2">
                  <Calendar className="w-3.5 h-3.5 text-brand-700" />
                  <span>Preferred Date</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="px-3 py-3 rounded-xl border border-neutral-200 bg-neutral-50/60 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-700 text-neutral-800"
                  >
                    {months.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>

                  <select
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    className="px-3 py-3 rounded-xl border border-neutral-200 bg-neutral-50/60 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-700 text-neutral-800"
                  >
                    {days.map((d) => (
                      <option key={d} value={d}>Day {d}</option>
                    ))}
                  </select>

                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="px-3 py-3 rounded-xl border border-neutral-200 bg-neutral-50/60 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-700 text-neutral-800"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 4: Location & House Type (Screenshot #9) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-brand-950 uppercase tracking-wider mb-2">
                    <MapPin className="w-3.5 h-3.5 text-brand-700" />
                    <span>Location</span>
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50/60 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-700 text-neutral-800"
                  >
                    {locations.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-brand-950 uppercase tracking-wider mb-2">
                    <Home className="w-3.5 h-3.5 text-brand-700" />
                    <span>House Type</span>
                  </label>
                  <select
                    value={houseType}
                    onChange={(e) => setHouseType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50/60 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-700 text-neutral-800"
                  >
                    {houseTypes.map((ht) => (
                      <option key={ht} value={ht}>{ht}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Trust markers */}
              <div className="pt-2 flex items-center justify-between text-xs text-neutral-500 border-t border-neutral-100">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-brand-700" />
                  Confirmation in under 2 hours
                </span>
             
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-800 hover:bg-brand-900 disabled:opacity-70 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-98 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Submitting viewing schedule...</span>
                ) : (
                  <span>Confirm Viewing Appointment</span>
                )}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
