import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  CalendarCheck,
  Mail,
  PlusCircle,
  LogOut,
  Trash2,
  CheckCircle,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  Star,
  Clock,
  Sparkles,
  CloudUpload,
  UserCheck
} from 'lucide-react';
import { Property } from '../../types';
import { AdminUser, logoutAdmin } from '../../lib/authClient';
import { AddPropertyPage } from './AddPropertyPage';
import { deleteProperty, updateProperty } from '../../lib/propertyStore';
import { getCoverImageUrl, transformForThumbnail } from '../../lib/cloudinary';

interface AdminDashboardPageProps {
  adminUser: AdminUser;
  properties: Property[];
  onPropertyAdded: (newProp: Property) => void;
  onPropertyUpdated?: (updated: Property) => void;
  onPropertyDeleted?: (id: string) => void;
  onSignOut: () => void;
  onViewProperty: (prop: Property) => void;
}

interface BookingRecord {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  contact: string;
  preferredDate?: {
    month: string;
    day: string;
    year: string;
  };
  location?: string;
  houseType?: string;
  propertyId?: string;
  status?: string;
  createdAt?: string;
}

interface InquiryRecord {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  comments: string;
  createdAt?: string;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  adminUser,
  properties,
  onPropertyAdded,
  onPropertyUpdated,
  onPropertyDeleted,
  onSignOut,
  onViewProperty,
}) => {
  const [activeTab, setActiveTab] = useState<'listings' | 'add' | 'bookings' | 'inquiries' | 'security'>('listings');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  
  // Bookings & Inquiries state
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Load Bookings & Inquiries
  const loadAdminRecords = async () => {
    setIsLoadingData(true);
    try {
      const [bookingsRes, inquiriesRes] = await Promise.all([
        fetch('/api/admin/bookings', { credentials: 'include' }),
        fetch('/api/admin/inquiries', { credentials: 'include' }),
      ]);

      if (bookingsRes.ok) {
        const bData = await bookingsRes.json();
        setBookings(Array.isArray(bData) ? bData : []);
      }

      if (inquiriesRes.ok) {
        const iData = await inquiriesRes.json();
        setInquiries(Array.isArray(iData) ? iData : []);
      }
    } catch (err) {
      console.error('Failed to load admin records:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'bookings' || activeTab === 'inquiries') {
      loadAdminRecords();
    }
  }, [activeTab]);

  const handleToggleStatus = async (property: Property) => {
    const nextStatus = property.status === 'Available' ? 'Pending' : property.status === 'Pending' ? 'Sold' : 'Available';
    const propId = property._id || property.id || '';
    if (!propId) return;

    try {
      const updated = await updateProperty(propId, { status: nextStatus });
      if (updated && onPropertyUpdated) onPropertyUpdated(updated);
      showNotice(`Status updated to "${nextStatus}" for "${property.title}"`);
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handleToggleFeatured = async (property: Property) => {
    const propId = property._id || property.id || '';
    if (!propId) return;

    try {
      const updated = await updateProperty(propId, { featured: !property.featured });
      if (updated && onPropertyUpdated) onPropertyUpdated(updated);
      showNotice(
        property.featured
          ? `Removed "${property.title}" from Featured showcase`
          : `Added "${property.title}" to Featured showcase`
      );
    } catch (err) {
      alert('Failed to update featured flag.');
    }
  };

  const handleDelete = async (property: Property) => {
    const propId = property._id || property.id || '';
    if (!propId) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${property.title}"? This will permanently remove the listing from the marketplace.`
    );
    if (!confirmed) return;

    try {
      await deleteProperty(propId);
      if (onPropertyDeleted) onPropertyDeleted(propId);
      showNotice(`Successfully deleted listing: "${property.title}"`);
    } catch (err) {
      alert('Failed to delete property. Please verify your admin session.');
    }
  };

  const showNotice = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  const filteredProperties = properties.filter((p) => {
    const matchesSearch =
      (p.title?.toLowerCase()?.includes(searchQuery.toLowerCase()) ?? false) ||
      (p.location?.neighborhood?.toLowerCase()?.includes(searchQuery.toLowerCase()) ?? false) ||
      (p.propertyType?.toLowerCase()?.includes(searchQuery.toLowerCase()) ?? false);
    const matchesType = filterType === 'All' || p.propertyType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-neutral-100/70 pb-20 text-left">
      
      {/* TOP ADMIN BANNER & HEADER */}
      <div className="bg-brand-950 text-white border-b border-brand-900 sticky top-20 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Admin identity block */}
            <div className="flex items-center gap-3.5">
            
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">
                    Perfect Homes
                  </h1>
                 
                </div>
                <p className="text-xs text-neutral-300 flex items-center gap-2 mt-0.5">
                  <span>Signed in: <strong className="text-white">{adminUser.name}</strong></span>
               
                </p>
              </div>
            </div>

            {/* Quick Actions & Logout */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => setActiveTab('add')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-brand-800 hover:bg-brand-700 text-white shadow-xs transition-colors"
              >
                <PlusCircle className="w-4 h-4 text-amber-300" />
                <span>New Property</span>
              </button>

              <button
                onClick={async () => {
                  await logoutAdmin();
                  onSignOut();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-white/10 hover:bg-rose-900/60 hover:text-rose-200 text-neutral-200 border border-white/10 transition-colors"
                title="End secure session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>

          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1 sm:gap-2 mt-5 pt-3 border-t border-white/10 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('listings')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'listings'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-brand-700" />
              <span>Property Listings ({properties.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('add')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'add'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5 text-brand-700" />
              <span>Add Property</span>
            </button>

            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'bookings'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5 text-brand-700" />
              <span>Client Viewings ({bookings.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('inquiries')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'inquiries'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-brand-700" />
              <span>Inquiries & Messages ({inquiries.length})</span>
            </button>

          
          </div>

        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Status notification */}
        {statusMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2.5 shadow-xs animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* TAB 1: PROPERTY LISTINGS & INVENTORY */}
        {activeTab === 'listings' && (
          <div className="space-y-6">
            
            {/* Filter and Search Bar */}
            <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter listings by name or location..."
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-700"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-neutral-500 shrink-0" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 text-xs rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none text-neutral-700 font-medium"
                >
                  <option value="All">All Types</option>
                  <option value="Apartment">Apartments</option>
                  <option value="Studio">Studios</option>
              
                </select>

                <span className="text-xs text-neutral-500 font-semibold px-2">
                  Showing {filteredProperties.length} of {properties.length}
                </span>
              </div>
            </div>

            {/* Listings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => {
                const coverUrl = getCoverImageUrl(property.images);
                const thumbUrl = transformForThumbnail(coverUrl);
                const propId = property._id || property.id || '';

                return (
                  <div
                    key={propId}
                    className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col"
                  >
                    {/* Image Thumbnail */}
                    <div className="relative h-44 bg-neutral-100 overflow-hidden group">
                      <img
                        src={thumbUrl}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      
                      {/* Price Badge */}
                      <span className="absolute top-3 left-3 bg-brand-950/90 text-white font-extrabold text-xs px-2.5 py-1 rounded-md shadow-xs backdrop-blur-xs">
                        {property.currency} {property.price.toLocaleString()}
                      </span>

                      {/* Featured Star Toggle */}
                      <button
                        onClick={() => handleToggleFeatured(property)}
                        className={`absolute top-3 right-3 p-1.5 rounded-full transition-all shadow-xs ${
                          property.featured
                            ? 'bg-amber-400 text-neutral-900 ring-2 ring-white'
                            : 'bg-black/40 text-white hover:bg-black/60'
                        }`}
                        title={property.featured ? 'Featured on Homepage' : 'Mark as Featured'}
                      >
                        <Star className={`w-3.5 h-3.5 ${property.featured ? 'fill-current' : ''}`} />
                      </button>

                      {/* Cloudinary Photo Count */}
                      <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-semibold px-2 py-0.5 rounded backdrop-blur-xs flex items-center gap-1">
                        <CloudUpload className="w-3 h-3 text-amber-300" />
                        {property.images?.length || 1} photos
                      </span>
                    </div>

                    {/* Property Card Details */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-neutral-500 font-semibold mb-1">
                          <span className="uppercase tracking-wider text-brand-700">{property.propertyType}</span>
                          <span>{property.listingType}</span>
                        </div>
                        <h3 className="font-bold text-neutral-900 text-sm line-clamp-1">
                          {property.title}
                        </h3>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {property.location.neighborhood}, {property.location.city}
                        </p>
                      </div>

                      {/* Specs */}
                      <div className="grid grid-cols-3 gap-2 py-2 border-y border-neutral-100 text-center text-[11px] text-neutral-600">
                        <div>
                          <strong className="block text-neutral-900 text-xs">{property.bedrooms}</strong> Beds
                        </div>
                        <div>
                          <strong className="block text-neutral-900 text-xs">{property.bathrooms}</strong> Baths
                        </div>
                        <div>
                          <strong className="block text-neutral-900 text-xs">{property.squareFeet}</strong> sqft
                        </div>
                      </div>

                      {/* Status Toggle & Actions */}
                      <div className="flex items-center justify-between pt-1 gap-2">
                        {/* Status Toggle Button */}
                        <button
                          onClick={() => handleToggleStatus(property)}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-md border transition-colors ${
                            property.status === 'Available'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : property.status === 'Pending'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                              : 'bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200'
                          }`}
                          title="Click to toggle status: Available -> Pending -> Sold"
                        >
                          ● {property.status}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onViewProperty(property)}
                            className="p-1.5 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-brand-900 transition-colors"
                            title="Preview listing in modal"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(property)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete listing"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>

            {filteredProperties.length === 0 && (
              <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center space-y-3">
                <Building2 className="w-10 h-10 text-neutral-300 mx-auto" />
                <h3 className="font-bold text-neutral-700 text-base">No properties found</h3>
                <p className="text-xs text-neutral-500">Try adjusting your search keywords or filter category.</p>
              </div>
            )}

          </div>
        )}

        {/* TAB 2: ADD NEW PROPERTY */}
        {activeTab === 'add' && (
          <div className="max-w-4xl mx-auto">
            <AddPropertyPage
              adminUser={adminUser}
              onPropertyAdded={(newProp) => {
                onPropertyAdded(newProp);
                showNotice(`Listing "${newProp.title}" added to marketplace.`);
                setActiveTab('listings');
              }}
              onBrowseProperties={() => setActiveTab('listings')}
            />
          </div>
        )}

        {/* TAB 3: CLIENT BOOKING REQUESTS */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div>
                <h2 className="text-base font-bold text-neutral-900">
                  Client Viewing Bookings
                </h2>
                <p className="text-xs text-neutral-500">
                  Site visit inspection requests submitted from the public "Book For View" page.
                </p>
              </div>

              <button
                onClick={loadAdminRecords}
                disabled={isLoadingData}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {bookings.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <CalendarCheck className="w-10 h-10 text-neutral-300 mx-auto" />
                <p className="text-xs font-semibold text-neutral-600">No booking requests submitted yet.</p>
                <p className="text-[11px] text-neutral-400">Public visitors who book viewing sessions will appear here in real time.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-neutral-50 text-neutral-600 font-bold uppercase tracking-wider text-[10px] border-b border-neutral-200">
                    <tr>
                      <th className="py-3 px-4">Client Name</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Preferred Date</th>
                      <th className="py-3 px-4">Location Preference</th>
                      <th className="py-3 px-4">Property Type</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {bookings.map((booking, idx) => (
                      <tr key={booking._id || idx} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-neutral-900">
                          {booking.firstName} {booking.lastName}
                        </td>
                        <td className="py-3 px-4 space-y-0.5">
                          <div className="font-mono text-[11px] text-neutral-800">{booking.contact}</div>
                          <div className="text-[11px] text-neutral-500">{booking.email}</div>
                        </td>
                        <td className="py-3 px-4 font-medium text-neutral-700">
                          {booking.preferredDate
                            ? `${booking.preferredDate.month} ${booking.preferredDate.day}, ${booking.preferredDate.year}`
                            : 'Flexible'}
                        </td>
                        <td className="py-3 px-4 font-semibold text-neutral-800">
                          {booking.location || 'Nairobi'}
                        </td>
                        <td className="py-3 px-4 text-neutral-600">
                          {booking.houseType || 'Apartment'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            {booking.status || 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CLIENT INQUIRIES & MESSAGES */}
        {activeTab === 'inquiries' && (
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div>
                <h2 className="text-base font-bold text-neutral-900">
                  Client Messages & Inquiries
                </h2>
                <p className="text-xs text-neutral-500">
                  Inquiries submitted via the Contact Us form and property inquiry modals.
                </p>
              </div>

              <button
                onClick={loadAdminRecords}
                disabled={isLoadingData}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {inquiries.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Mail className="w-10 h-10 text-neutral-300 mx-auto" />
                <p className="text-xs font-semibold text-neutral-600">No contact inquiries recorded yet.</p>
                <p className="text-[11px] text-neutral-400">Messages sent via Contact Us will be collected here for administrator follow-up.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {inquiries.map((inq, idx) => (
                  <div
                    key={inq._id || idx}
                    className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <div className="font-bold text-neutral-900 flex items-center gap-2">
                        <span>{inq.firstName} {inq.lastName}</span>
                        <span className="text-neutral-400 font-normal">•</span>
                        <span className="text-brand-700 font-mono text-[11px]">{inq.email}</span>
                        {inq.phone && <span className="text-neutral-500 text-[11px]">({inq.phone})</span>}
                      </div>
                      <span className="text-[10px] text-neutral-400">
                        {inq.createdAt ? new Date(inq.createdAt).toLocaleString() : 'Recently'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-700 bg-white p-3 rounded-lg border border-neutral-200/80 leading-relaxed">
                      "{inq.comments}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

   

      </div>

    </div>
  );
};
